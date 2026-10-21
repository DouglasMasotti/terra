'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { InccRate, LandReceipt } from '@/types'
import { INITIAL_INCC_RATES } from '@/lib/land-simulator'

const RECEIPTS_KEY = 'terra_land_receipts_v1'
const RATES_KEY = 'terra_land_incc_rates_v1'
const RATES_SEED_KEY = 'terra_land_incc_seed_v1'

interface AppContextValue {
  landReceipts: LandReceipt[]
  inccRates: InccRate[]
  isLoaded: boolean
  addLandReceipt: (receipt: LandReceipt) => void
  removeLandReceipt: (id: string) => void
  updateLandInccRates: (rates: InccRate[]) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function readArray<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value as T[] : []
  } catch {
    return []
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [landReceipts, setLandReceipts] = useState<LandReceipt[]>([])
  const [inccRates, setInccRates] = useState<InccRate[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setLandReceipts(readArray<LandReceipt>(RECEIPTS_KEY))
    const storedRates = readArray<InccRate>(RATES_KEY)
    if (localStorage.getItem(RATES_SEED_KEY) !== 'applied') {
      const suppliedMonths = new Set(INITIAL_INCC_RATES.map((rate) => rate.yearMonth))
      setInccRates([
        ...storedRates.filter((rate) => !suppliedMonths.has(rate.yearMonth)),
        ...INITIAL_INCC_RATES,
      ].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)))
      localStorage.setItem(RATES_SEED_KEY, 'applied')
    } else {
      setInccRates(storedRates)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) localStorage.setItem(RECEIPTS_KEY, JSON.stringify(landReceipts))
  }, [isLoaded, landReceipts])

  useEffect(() => {
    if (isLoaded) localStorage.setItem(RATES_KEY, JSON.stringify(inccRates))
  }, [isLoaded, inccRates])

  const addLandReceipt = useCallback((receipt: LandReceipt) => {
    setLandReceipts((current) => [...current, receipt])
  }, [])

  const removeLandReceipt = useCallback((id: string) => {
    setLandReceipts((current) => current.filter((receipt) => receipt.id !== id))
  }, [])

  const updateLandInccRates = useCallback((yearRates: InccRate[]) => {
    setInccRates((current) => {
      const next = [...current]
      for (const rate of yearRates) {
        const index = next.findIndex((entry) => entry.yearMonth === rate.yearMonth)
        if (index < 0) next.push(rate)
        else next[index] = rate
      }
      return next.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth))
    })
  }, [])

  return (
    <AppContext.Provider value={{ landReceipts, inccRates, isLoaded, addLandReceipt, removeLandReceipt, updateLandInccRates }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
