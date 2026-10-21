'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/lib/AppContext'
import { fmtBRL } from '@/lib/utils'
import { FIRST_YEAR, LAND_TARGET_PER_LOT, LAND_TOTAL_TARGET, LAND_YEARS, LAST_YEAR, simulateLandYear, type LandYearProjection } from '@/lib/land-simulator'
import { Plus, Settings2, Trash2 } from 'lucide-react'
import LandReceiptForm from './LandReceiptForm'
import LandInccRatesEditor from './LandInccRatesEditor'
import LandYearSimulator from './LandYearSimulator'
import LandYearlyProgress from './LandYearlyProgress'

function currentContractYear(): number {
  return Math.min(LAST_YEAR, Math.max(FIRST_YEAR, new Date().getFullYear()))
}

function formatReceiptDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')
}

export default function LandDashboard() {
  const { landReceipts, inccRates, isLoaded, removeLandReceipt } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [showRates, setShowRates] = useState(false)
  const [simulatedYear, setSimulatedYear] = useState(currentContractYear)

  const simulation = useMemo(
    () => simulateLandYear(simulatedYear, landReceipts, inccRates),
    [simulatedYear, landReceipts, inccRates]
  )

  const yearProjections = useMemo<LandYearProjection[]>(
    () => LAND_YEARS.map((year) => {
      const yearSimulation = simulateLandYear(year, landReceipts, inccRates)
      const yearTarget = yearSimulation.yearTargets.find((target) => target.year === year)!
      return {
        year,
        receivedThisYear: yearTarget.receivedThisYear,
        met: yearTarget.met,
        inccAddedAtStartOfYear: yearSimulation.inccAddedAtStartOfYear,
        totalDueAtYearEnd: yearSimulation.pendingAmount,
      }
    }),
    [landReceipts, inccRates]
  )

  const receipts = useMemo(
    () => [...landReceipts].sort((a, b) => b.date.localeCompare(a.date)),
    [landReceipts]
  )

  if (!isLoaded) {
    return <main className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-400">Carregando o painel…</main>
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Caxias do Sul · RS</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Terrenos D / W</h1>
          <p className="mt-1 text-sm text-slate-400">Acompanhamento de recebimentos, saldo e correção anual</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowRates(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            <Settings2 size={16} /> INCC mensal
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-300/30 bg-blue-300/10 px-4 py-2.5 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-300/20"
          >
            <Plus size={16} /> Registrar recebimento
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm">
        <span className="text-slate-400">Valor original total do contrato</span>
        <span className="font-semibold text-white">{fmtBRL(LAND_TOTAL_TARGET)} <span className="font-normal text-slate-500">· {fmtBRL(LAND_TARGET_PER_LOT)} por terreno</span></span>
      </div>

      <LandYearSimulator
        simulatedYear={simulatedYear}
        onYearChange={setSimulatedYear}
        simulation={simulation}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Saldos por terreno">
        {simulation.breakdown.map((terrain) => (
          <TerrainCard key={terrain.terrain} terrain={terrain} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Resumo do contrato">
        <SummaryMetric label={`Recebido até ${simulatedYear}`} value={fmtBRL(simulation.receivedUpToYear)} color="text-emerald-300" />
        <SummaryMetric label="Saldo corrigido a receber" value={fmtBRL(simulation.pendingAmount)} color="text-amber-200" />
        <SummaryMetric label="INCC aplicado ao saldo" value={`+${fmtBRL(simulation.inccAccumulated)}`} color="text-violet-200" />
      </section>

      <LandYearlyProgress
        currentYear={simulatedYear}
        yearProjections={yearProjections}
        lateCharges={simulation.annualLateCharges}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-700/50 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Histórico</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Recebimentos</h2>
          </div>
          <span className="text-xs text-slate-500">{receipts.length} {receipts.length === 1 ? 'registro' : 'registros'}</span>
        </div>

        {receipts.length === 0 ? (
          <div className="px-5 py-10 text-center sm:px-6">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400">
              <Plus size={17} />
            </div>
            <p className="text-sm font-medium text-slate-300">Nenhum recebimento registrado</p>
            <p className="mt-1 text-xs text-slate-500">Registre a data, o lote e o valor recebido.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${receipt.type === 'D' ? 'bg-blue-400/10 text-blue-200' : 'bg-cyan-400/10 text-cyan-200'}`}>
                  {receipt.type}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-white">Lote {receipt.type}</span>
                    <span className="text-xs text-slate-500">{formatReceiptDate(receipt.date)}</span>
                    <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
                      Conta de {receipt.type === 'D' ? 'Douglas' : 'William'}
                    </span>
                  </div>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-200">{fmtBRL(receipt.amount)}</span>
                <button
                  onClick={() => removeLandReceipt(receipt.id)}
                  aria-label={`Excluir recebimento de ${fmtBRL(receipt.amount)} do lote ${receipt.type} em ${formatReceiptDate(receipt.date)}`}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-400/10 hover:text-rose-300"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="px-1 text-xs leading-relaxed text-slate-500">
        As informações e taxas INCC-M são salvas neste navegador. Os meses ainda sem taxa informada usam a estimativa editável de 0,50%.
      </p>

      {showForm && <LandReceiptForm onClose={() => setShowForm(false)} />}
      {showRates && <LandInccRatesEditor onClose={() => setShowRates(false)} />}
    </main>
  )
}

function SummaryMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

function TerrainCard({ terrain }: { terrain: LandSimulation['breakdown'][number] }) {
  const isD = terrain.terrain === 'D'
  const total = terrain.received + terrain.pending
  const receivedPercent = total > 0 ? Math.min((terrain.received / total) * 100, 100) : 0
  const progressColor = isD ? 'bg-blue-300' : 'bg-cyan-300'

  return (
    <article className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isD ? 'text-blue-300' : 'text-cyan-300'}`}>Acompanhamento individual</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Lote {terrain.terrain}</h2>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${isD ? 'border-blue-300/20 bg-blue-300/5 text-blue-200' : 'border-cyan-300/20 bg-cyan-300/5 text-cyan-200'}`}>
          Original {fmtBRL(terrain.baseTarget)}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Saldo corrigido</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{fmtBRL(terrain.pending)}</p>
        </div>
        {terrain.inccApplied > 0.005 && (
          <p className="text-right text-xs text-violet-200">INCC no saldo<br /><span className="mt-0.5 inline-block font-semibold">+{fmtBRL(terrain.inccApplied)}</span></p>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-500">Recebido</span>
          <span className={`font-medium ${isD ? 'text-blue-200' : 'text-cyan-200'}`}>{fmtBRL(terrain.received)} <span className="text-slate-500">/ {fmtBRL(total)}</span></span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${receivedPercent}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">A correção anual incide somente no saldo levado ao ano seguinte.</p>
      </div>
    </article>
  )
}

type LandSimulation = ReturnType<typeof simulateLandYear>
