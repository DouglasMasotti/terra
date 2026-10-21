'use client'

import { fmtBRL } from '@/lib/utils'
import { LAST_YEAR, type AnnualLateCharge, type LandYearProjection } from '@/lib/land-simulator'

interface LandYearlyProgressProps {
  currentYear: number
  yearProjections: LandYearProjection[]
  lateCharges: AnnualLateCharge[]
}

export default function LandYearlyProgress({ currentYear, yearProjections, lateCharges }: LandYearlyProgressProps) {
  return (
    <section className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] palette-gold">Acompanhamento</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Parcela anual e saldo corrigido</h2>
        </div>
        <p className="text-sm text-slate-400">Parcela mínima: 15% do saldo atualizado · lotes D + W</p>
      </div>

      <div className="space-y-4">
        {yearProjections.map((projection) => {
          const isCurrent = currentYear === projection.year
          const missed = currentYear >= projection.year && !projection.met
          const met = projection.met
          const lateCharge = lateCharges.find((charge) => charge.year === projection.year)
          const percentage = projection.annualMinimum > 0
            ? Math.min((projection.receivedThisYear / projection.annualMinimum) * 100, 100)
            : 100
          const color = missed ? 'palette-bg-wine' : met ? 'palette-bg-sand' : isCurrent ? 'palette-bg-gold' : 'bg-slate-600'
          const status = met ? 'Meta atingida' : missed ? (isCurrent ? 'Não atingido no fechamento simulado' : 'Mínimo não atingido') : isCurrent ? 'Atingido no fechamento simulado' : 'Previsto'

          return (
            <div key={projection.year}>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${missed ? 'palette-clay' : 'text-slate-200'}`}>{projection.year}</span>
                  {projection.year === LAST_YEAR && <span className="rounded-full palette-border-gold palette-bg-gold-soft px-2 py-0.5 text-[10px] font-medium palette-cream">Quitação até 30 dez</span>}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={missed ? 'palette-clay' : met ? 'palette-gold' : 'text-slate-500'}>{status}</span>
                  <span className="font-medium text-slate-300">{fmtBRL(projection.receivedThisYear)} / {fmtBRL(projection.annualMinimum)}</span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percentage}%` }} />
              </div>
              {lateCharge && (lateCharge.penalty > 0 || lateCharge.interest > 0) && (
                <p className="mt-1.5 text-[11px] palette-clay">
                  Falta anual de {fmtBRL(lateCharge.shortfallAtClose)} · multa {fmtBRL(lateCharge.penalty)} · juros acumulados {fmtBRL(lateCharge.interest)}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-slate-500">O INCC de cada ano é aplicado em janeiro seguinte ao saldo que restou em cada lote. Em 2030, o saldo integral corrigido vence até 30 de dezembro.</p>
    </section>
  )
}
