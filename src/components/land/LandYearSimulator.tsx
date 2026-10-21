'use client'

import { fmtBRL } from '@/lib/utils'
import { LAND_ANNUAL_MINIMUM, LAND_YEARS, type LandSimulation } from '@/lib/land-simulator'
import { TrendingUp } from 'lucide-react'

interface LandYearSimulatorProps {
  simulatedYear: number
  onYearChange: (year: number) => void
  simulation: LandSimulation
}

export default function LandYearSimulator({ simulatedYear, onYearChange, simulation }: LandYearSimulatorProps) {
  const totalPenalty = simulation.latePenalty + simulation.finalPenalty
  const annualChargeYears = simulation.annualLateCharges.filter((charge) => charge.shortfallAtClose > 0)

  return (
    <section className="rounded-2xl border border-amber-400/20 bg-slate-900/70 p-5 sm:p-6" aria-label="Simulação por ano">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">Simulação do contrato</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp size={17} className="text-amber-300" />
            Avance o ano para acompanhar INCC e mora
          </h2>
          <p className="mt-1 text-sm text-slate-400">Veja o fechamento de cada ano com os recebimentos registrados até aquela data.</p>
        </div>
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-100/60">Data da simulação</p>
          <p className="text-xl font-bold text-amber-300">{simulatedYear}</p>
          <p className="text-xs text-slate-400">{simulatedYear === 2030 ? '30 de dezembro · vencimento' : '31 de dezembro · fechamento'}</p>
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
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          {LAND_YEARS.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => onYearChange(year)}
              aria-current={simulatedYear === year ? 'step' : undefined}
              className={`rounded px-1 py-0.5 transition-colors hover:text-white ${simulatedYear === year ? 'font-semibold text-amber-300' : ''}`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Metric label="Saldo principal corrigido" value={fmtBRL(simulation.pendingAmount)} valueClass="text-amber-100" />
        <Metric label="INCC aplicado" value={`+${fmtBRL(simulation.inccAccumulated)}`} valueClass="text-violet-200" />
        <Metric label="Multas de 2%" value={fmtBRL(totalPenalty)} valueClass="text-rose-200" />
        <Metric label="Juros de mora" value={fmtBRL(simulation.lateInterest)} valueClass="text-orange-200" />
        <Metric label="Saldo + encargos" value={fmtBRL(simulation.totalDueWithCharges)} valueClass="text-white" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-violet-400/15 bg-violet-400/5 p-3.5 text-xs leading-relaxed text-violet-100/80">
          <p className="font-semibold text-violet-100">INCC no saldo</p>
          <p className="mt-1">A soma simples das taxas mensais de cada ano é aplicada em janeiro seguinte ao saldo que restou em cada lote, depois de descontados os pagamentos daquele lote.</p>
        </div>
        <div className="rounded-xl border border-rose-400/15 bg-rose-400/5 p-3.5 text-xs leading-relaxed text-rose-100/80">
          <p className="font-semibold text-rose-100">Falta da amortização anual</p>
          <p className="mt-1">Se o total recebido no ano ficar abaixo de {fmtBRL(LAND_ANNUAL_MINIMUM)}, a projeção aplica multa de 2% sobre a falta e juros de 1% ao mês, pro rata die, até regularização. Recebimentos posteriores cobrem primeiro a falta anual mais antiga; a multa continua devida e os juros param sobre o valor regularizado.</p>
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
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3.5 text-xs leading-relaxed text-amber-100/80">
          <p className="font-semibold text-amber-100">Vencimento final em 30/12/2030</p>
          <p className="mt-1">A multa final de 2% sobre o saldo corrigido está incluída acima. O contrato também prevê juros de 1% ao mês, pro rata die, após o vencimento. Se o saldo continuar sem regularização após 90 dias, com notificação formal e mais 15 dias para pagar, prevê multa compensatória de 10% sobre o valor total do contrato ({fmtBRL(simulation.conditionalCompensatoryPenalty)}); esse valor condicional não está incluído no saldo + encargos.</p>
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
        Projeção no fechamento indicado. Multas e juros são encargos separados do saldo principal corrigido pelo INCC; o simulador distribui pagamentos posteriores primeiro às faltas anuais mais antigas para estimar quando os juros cessam.
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
