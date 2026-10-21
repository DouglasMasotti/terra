'use client'

import { fmtBRL } from '@/lib/utils'
import { LAND_ANNUAL_MINIMUM, LAND_YEARS, type LandSimulation } from '@/lib/land-simulator'
import { TrendingUp } from 'lucide-react'

interface LandYearSimulatorProps {
  simulatedYear: number
  annualInccPercent: number
  onYearChange: (year: number) => void
  simulation: LandSimulation
}

export default function LandYearSimulator({ simulatedYear, annualInccPercent, onYearChange, simulation }: LandYearSimulatorProps) {
  const totalPenalty = simulation.latePenalty + simulation.finalPenalty
  const annualChargeYears = simulation.annualLateCharges.filter((charge) => charge.shortfallAtClose > 0)
  const selectedAnnualMinimum = simulation.yearTargets.find((target) => target.year === simulatedYear)?.min ?? LAND_ANNUAL_MINIMUM

  return (
    <section className="rounded-2xl palette-border-gold bg-slate-900/70 p-5 sm:p-6" aria-label="Simulação por ano">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] palette-gold">Simulação do contrato</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp size={17} className="palette-cream" />
            Avance o ano para acompanhar o saldo corrigido
          </h2>
          <p className="mt-1 text-sm text-slate-400">O INCC atualiza o saldo em janeiro; a parcela anual é 15% desse saldo.</p>
        </div>
        <div className="flex min-h-[5.25rem] w-48 flex-col justify-center rounded-xl palette-border-wine palette-bg-wine-soft px-4 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider palette-sand">INCC do ano</p>
          <p className="text-xl font-bold palette-cream">{simulatedYear}</p>
          <p className="text-xs text-slate-400">{annualInccPercent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</p>
        </div>
        <div className="flex min-h-[5.25rem] w-48 flex-col justify-center rounded-xl palette-border-gold palette-bg-gold-soft px-4 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Data da simulação</p>
          <p className="text-xl font-bold palette-cream">{simulatedYear}</p>
          <p className="text-xs text-slate-400">
            {simulatedYear === 2030
              ? '30 de dezembro · vencimento'
              : simulatedYear === LAND_YEARS[0]
                ? 'sem mora anual anterior'
                : `mora de ${simulatedYear - 1} aplicada`}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-4">
        <label htmlFor="land-year-slider" className="sr-only">Ano da simulação</label>
        <input
          id="land-year-slider"
          aria-label="Ano da simulação"
          type="range"
          min={LAND_YEARS[0]}
          max={LAND_YEARS[LAND_YEARS.length - 1]}
          step="1"
          value={simulatedYear}
          onChange={(event) => onYearChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-[#E5BE68] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE7A0]"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          {LAND_YEARS.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => onYearChange(year)}
              aria-current={simulatedYear === year ? 'step' : undefined}
              className={`rounded px-1 py-0.5 transition-colors hover:text-white ${simulatedYear === year ? 'font-semibold palette-cream' : ''}`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Metric label="Saldo principal corrigido" value={fmtBRL(simulation.pendingAmount)} valueClass="palette-cream" />
        <Metric label="INCC aplicado" value={`+${fmtBRL(simulation.inccAccumulated)}`} valueClass="palette-sand" />
        <Metric label="Multas de 2%" value={fmtBRL(totalPenalty)} valueClass="palette-clay" />
        <Metric label="Juros de mora" value={fmtBRL(simulation.lateInterest)} valueClass="palette-clay" />
        <Metric label="Saldo + encargos" value={fmtBRL(simulation.totalDueWithCharges)} valueClass="text-white" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl palette-border-sand palette-bg-sand-soft p-3.5 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold palette-sand">INCC no saldo</p>
          <p className="mt-1">A soma simples das taxas mensais do ano é aplicada em janeiro seguinte ao saldo que restou em cada lote.</p>
        </div>
        <div className="rounded-xl palette-border-wine palette-bg-wine-soft p-3.5 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold palette-clay">Falta da amortização anual</p>
          <p className="mt-1">Se o total recebido em {simulatedYear} ficar abaixo de {fmtBRL(selectedAnnualMinimum)}, a multa de 2% sobre a diferença só aparece no ano seguinte. Os juros de mora também começam então.</p>
        </div>
      </div>

      {annualChargeYears.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-950/30 p-3.5">
          <p className="text-xs font-semibold text-slate-200">Faltas anuais na simulação</p>
          <div className="mt-2 space-y-2">
            {annualChargeYears.map((charge) => (
              <div key={charge.year} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
                <span className="text-slate-300">{charge.year}: falta original {fmtBRL(charge.shortfallAtClose)}</span>
                <span className="text-slate-400">multa {fmtBRL(charge.penalty)} · juros {fmtBRL(charge.interest)} · principal em mora {fmtBRL(charge.latePrincipalRemaining)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {simulatedYear === 2030 && (
        <div className="mt-4 rounded-xl palette-border-gold palette-bg-gold-soft p-3.5 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold palette-cream">Vencimento final em 30/12/2030</p>
          <p className="mt-1">A multa final de 2% sobre o saldo corrigido está incluída acima. O contrato também prevê juros de 1% ao mês, pro rata die, após o vencimento. Se o saldo continuar sem regularização após 90 dias, com notificação formal e mais 15 dias para pagar, prevê multa compensatória de 10% sobre o valor total do contrato ({fmtBRL(simulation.conditionalCompensatoryPenalty)}); esse valor condicional não está incluído no saldo + encargos.</p>
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
        Multas e juros são encargos separados do saldo principal corrigido pelo INCC. A falta do ano selecionado só entra como mora quando o slider avança para o ano seguinte; pagamentos posteriores cobrem as faltas anuais mais antigas para estimar quando os juros cessam.
      </p>
    </section>
  )
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5">
      <p className="text-[10px] leading-snug text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}
