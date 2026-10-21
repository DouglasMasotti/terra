'use client'

import { fmtBRL } from '@/lib/utils'
import { LAND_ANNUAL_MINIMUM, LAST_YEAR, type AnnualLateCharge, type YearTarget } from '@/lib/land-simulator'

interface LandYearlyProgressProps {
  currentYear: number
  yearTargets: YearTarget[]
  lateCharges: AnnualLateCharge[]
}

export default function LandYearlyProgress({ currentYear, yearTargets, lateCharges }: LandYearlyProgressProps) {
  return (
    <section className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">Acompanhamento</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Mínimo anual recebido</h2>
        </div>
        <p className="text-sm text-slate-400">R$ 54.000 por ano, somando os dois lotes</p>
      </div>

      <div className="space-y-4">
        {yearTargets.map((target) => {
          const isPassed = currentYear > target.year
          const isCurrent = currentYear === target.year
          const missed = currentYear >= target.year && !target.met
          const met = target.met
          const lateCharge = lateCharges.find((charge) => charge.year === target.year)
          const percentage = Math.min((target.receivedThisYear / LAND_ANNUAL_MINIMUM) * 100, 100)
          const color = missed ? 'bg-rose-400' : met ? 'bg-emerald-400' : isCurrent ? 'bg-amber-300' : 'bg-slate-600'
          const status = met ? 'Meta atingida' : missed ? (isCurrent ? 'Não atingido no fechamento simulado' : 'Mínimo não atingido') : isCurrent ? 'Atingido no fechamento simulado' : 'Previsto'

          return (
            <div key={target.year}>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${missed ? 'text-rose-300' : 'text-slate-200'}`}>{target.year}</span>
                  {target.year === LAST_YEAR && <span className="rounded-full border border-blue-400/20 bg-blue-400/5 px-2 py-0.5 text-[10px] font-medium text-blue-200">Quitação até 30 dez</span>}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={missed ? 'text-rose-300' : met ? 'text-emerald-300' : 'text-slate-500'}>{status}</span>
                  <span className="font-medium text-slate-300">{fmtBRL(target.receivedThisYear)} / {fmtBRL(LAND_ANNUAL_MINIMUM)}</span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percentage}%` }} />
              </div>
              {lateCharge && (lateCharge.penalty > 0 || lateCharge.interest > 0) && (
                <p className="mt-1.5 text-[11px] text-rose-200/80">
                  Falta anual de {fmtBRL(lateCharge.shortfallAtClose)} · multa {fmtBRL(lateCharge.penalty)} · juros acumulados {fmtBRL(lateCharge.interest)}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-5 rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-xs leading-relaxed text-slate-400">
        O recebimento anual é somado entre D e W, independentemente de qual vendedor recebeu. Em 2030, o saldo integral corrigido vence até 30 de dezembro.
      </p>
    </section>
  )
}
