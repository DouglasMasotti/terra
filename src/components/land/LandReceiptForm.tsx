'use client'

import { useState } from 'react'
import { useApp } from '@/lib/AppContext'
import { X } from 'lucide-react'
import type { LandReceipt } from '@/types'

interface LandReceiptFormProps {
  onClose: () => void
}

function localToday(): string {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export default function LandReceiptForm({ onClose }: LandReceiptFormProps) {
  const { addLandReceipt } = useApp()
  const [date, setDate] = useState(localToday)
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'D' | 'W'>('D')
  const [error, setError] = useState('')

  const year = Number(date.slice(0, 4))
  const isDateValid = date >= '2026-01-01' && date <= '2030-12-30'

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!date) {
      setError('Selecione a data do recebimento.')
      return
    }
    if (!isDateValid) {
      setError('A data deve estar entre 01/01/2026 e 30/12/2030.')
      return
    }
    const value = Number(amount)
    if (!amount || !Number.isFinite(value) || value <= 0) {
      setError('Informe um valor válido maior que zero.')
      return
    }

    const receipt: LandReceipt = {
      id: `land_${Date.now()}`,
      date,
      amount: value,
      type,
      year,
    }

    addLandReceipt(receipt)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <section role="dialog" aria-modal="true" aria-labelledby="receipt-title" className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700/60 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] palette-gold">Terrenos D / W</p>
              <h2 id="receipt-title" className="mt-1 text-lg font-semibold text-white">Novo recebimento</h2>
            </div>
            <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <label className="block text-xs font-semibold text-slate-400">
              Data do recebimento
              <input
                type="date"
                value={date}
                min="2026-01-01"
                max="2030-12-30"
                onChange={(event) => setDate(event.target.value)}
                className={`mt-2 w-full rounded-lg border bg-slate-800 px-3 py-2.5 text-sm text-white outline-none ${isDateValid ? 'border-slate-700 focus:border-[#E5BE68]' : 'border-[#9B3C2B]/70'}`}
              />
            </label>

            <label className="block text-xs font-semibold text-slate-400">
              Valor recebido (R$)
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#E5BE68]"
              />
            </label>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-400">Lote do recebimento</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['D', 'W'] as const).map((lot) => (
                  <button
                    key={lot}
                    type="button"
                    aria-pressed={type === lot}
                    onClick={() => setType(lot)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${type === lot ? (lot === 'D' ? 'palette-border-brick palette-bg-brick-soft palette-clay' : 'palette-border-gold palette-bg-gold-soft palette-cream') : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    Lote {lot}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">Lote D: Douglas · Lote W: William</p>
            </fieldset>

            {error && <p role="alert" className="rounded-lg palette-border-brick palette-bg-brick-soft p-3 text-xs palette-clay">{error}</p>}

            <div className="flex gap-2 border-t border-slate-700/50 pt-4">
              <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-700 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800">Cancelar</button>
              <button type="submit" className="flex-1 rounded-lg palette-border-gold palette-bg-gold-soft px-3 py-2.5 text-sm font-semibold palette-cream hover:bg-[#E5BE68]/20">Registrar recebimento</button>
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
