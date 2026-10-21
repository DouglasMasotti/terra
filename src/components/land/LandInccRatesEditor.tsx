'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/AppContext'
import { DEFAULT_MONTHLY_INCC, getMonthlyInccRate, LAND_YEARS } from '@/lib/land-simulator'
import { X } from 'lucide-react'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface LandInccRatesEditorProps {
  onClose: () => void
}

export default function LandInccRatesEditor({ onClose }: LandInccRatesEditorProps) {
  const { inccRates, updateLandInccRates } = useApp()
  const [year, setYear] = useState(() => Math.min(LAND_YEARS[LAND_YEARS.length - 1], Math.max(LAND_YEARS[0], new Date().getFullYear())))
  const [draftRates, setDraftRates] = useState<Record<number, string>>({})
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraftRates(Object.fromEntries(
      MONTHS.map((_, index) => [
        index + 1,
        getMonthlyInccRate(year, index + 1, inccRates).toFixed(2),
      ])
    ))
    setError('')
    setSaved(false)
  }, [year, inccRates])

  const annualPercent = useMemo(() => {
    return MONTHS.reduce((total, _, index) => {
      const rate = Number(draftRates[index + 1] ?? DEFAULT_MONTHLY_INCC)
      return total + (Number.isFinite(rate) ? rate : DEFAULT_MONTHLY_INCC)
    }, 0)
  }, [draftRates])

  const handleSave = () => {
    const yearRates = MONTHS.map((_, index) => {
      const month = index + 1
      const rate = Number(draftRates[month])
      return { yearMonth: `${year}-${String(month).padStart(2, '0')}`, rate, source: 'manual' as const }
    })

    if (yearRates.some(({ rate }) => !Number.isFinite(rate) || rate <= -100) || yearRates.reduce((sum, { rate }) => sum + rate, 0) <= -100) {
      setError('Cada taxa mensal e a soma anual precisam ser maiores que -100%.')
      setSaved(false)
      return
    }

    updateLandInccRates(yearRates)
    setError('')
    setSaved(true)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="land-incc-title"
          className="w-full max-w-2xl rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">Terrenos D / W</p>
              <h2 id="land-incc-title" className="mt-1 text-lg font-semibold text-white">INCC-M mensal</h2>
              <p className="mt-1 text-sm text-slate-400">Ajuste as taxas de janeiro a dezembro. Meses sem taxa salva começam em 0,50%.</p>
            </div>
            <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-5 p-5">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 sm:flex-row sm:items-end sm:justify-between">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-400">
                Ano
                <select
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  className="min-w-40 rounded-lg border border-slate-600/70 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                >
                  {LAND_YEARS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <div className="text-sm text-slate-400">
                Soma anual simples <span className="ml-1 font-semibold text-amber-300">{annualPercent.toFixed(2)}%</span>
              </div>
            </div>

            <div className="grid max-h-[45vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {MONTHS.map((monthName, index) => {
                const month = index + 1
                const yearMonth = `${year}-${String(month).padStart(2, '0')}`
                const storedRate = inccRates.find((rate) => rate.yearMonth === yearMonth)
                return (
                  <label key={month} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-2.5">
                    <span className="text-sm text-slate-300">{monthName}</span>
                    <span className="flex items-center gap-2">
                      <input
                        aria-label={`INCC-M de ${monthName} de ${year}`}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={draftRates[month] ?? ''}
                        onChange={(event) => {
                          setDraftRates((current) => ({ ...current, [month]: event.target.value }))
                          setSaved(false)
                        }}
                        className="w-24 rounded-md border border-slate-600/70 bg-slate-900 px-2.5 py-1.5 text-right text-sm text-white outline-none focus:border-amber-500"
                      />
                      <span className="w-14 text-right text-[10px] text-slate-500">
                        {storedRate?.source === 'auto' ? 'importada' : storedRate ? 'salva' : 'padrão'}
                      </span>
                      <span className="text-xs text-slate-500">%</span>
                    </span>
                  </label>
                )
              })}
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-xs leading-relaxed text-blue-200/80">
              A taxa anual é a soma simples das 12 taxas mensais. Com 0,50% em cada mês, o total anual é 6,00%. Essa taxa é aplicada em janeiro do ano seguinte somente ao saldo que restar em cada terreno. As taxas de 2030 ficam registradas para eventual saldo levado além do prazo final.
            </div>

            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            {saved && <p role="status" className="text-sm text-emerald-400">Taxas de {year} salvas neste navegador.</p>}

            <div className="flex justify-end gap-2 border-t border-slate-700/50 pt-4">
              <button onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Fechar</button>
              <button onClick={handleSave} className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-400/20">Salvar taxas</button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
