'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { InccRate, LandReceipt } from '@/types'
import { INITIAL_INCC_RATES } from '@/lib/land-simulator'

const RECEIPTS_KEY = 'terra_land_receipts_v1'
const RATES_KEY = 'terra_land_incc_rates_v1'
const RATES_SEED_KEY = 'terra_land_incc_seed_v1'

interface AppContextValue {
  landReceipts: LandReceipt[]
  inccRates: InccRate[]
  isLoaded: boolean
  cloudEnabled: boolean
  userEmail: string | null
  authPending: boolean
  authError: string | null
  sendSignInLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
  importLocalData: () => Promise<void>
  localDataCounts: { receipts: number; rates: number }
  dataError: string | null
  addLandReceipt: (receipt: LandReceipt) => Promise<void>
  removeLandReceipt: (id: string) => Promise<void>
  updateLandInccRates: (rates: InccRate[]) => Promise<void>
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
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authPending, setAuthPending] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [localDataCounts, setLocalDataCounts] = useState({ receipts: 0, rates: 0 })
  const cloudEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(() => {
    if (!cloudEnabled) return
    setLocalDataCounts({ receipts: readArray<LandReceipt>(RECEIPTS_KEY).length, rates: readArray<InccRate>(RATES_KEY).length })
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const load = async (email: string | null) => {
      setUserEmail(email)
      if (!email) { setIsLoaded(true); return }
      setIsLoaded(false)
      const [receiptsResult, ratesResult] = await Promise.all([
        client.from('land_receipts').select('id,date,amount,type,year').order('date'),
        client.from('incc_rates').select('year_month,rate,source').order('year_month'),
      ])
      if (receiptsResult.error || ratesResult.error) {
        setDataError(receiptsResult.error?.message ?? ratesResult.error?.message ?? 'Não foi possível carregar os dados.')
      } else {
        setDataError(null)
        setLandReceipts((receiptsResult.data ?? []).map((row) => ({ id: row.id, date: row.date, amount: Number(row.amount), type: row.type, year: row.year } as LandReceipt)))
        setInccRates((ratesResult.data ?? []).map((row) => ({ yearMonth: row.year_month, rate: Number(row.rate), source: row.source } as InccRate)))
      }
      setIsLoaded(true)
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => { void load(session?.user.email ?? null) })
    void client.auth.getSession().then(({ data }) => load(data.session?.user.email ?? null))
    return () => subscription.unsubscribe()
  }, [cloudEnabled])

  useEffect(() => {
    if (!cloudEnabled || !userEmail) return
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    let active = true
    const refresh = async () => {
      const [receiptsResult, ratesResult] = await Promise.all([
        client.from('land_receipts').select('id,date,amount,type,year').order('date'),
        client.from('incc_rates').select('year_month,rate,source').order('year_month'),
      ])
      if (!active) return
      if (receiptsResult.error || ratesResult.error) { setDataError(receiptsResult.error?.message ?? ratesResult.error?.message ?? 'Falha na atualização.'); return }
      setLandReceipts((receiptsResult.data ?? []).map((row) => ({ id: row.id, date: row.date, amount: Number(row.amount), type: row.type, year: row.year } as LandReceipt)))
      setInccRates((ratesResult.data ?? []).map((row) => ({ yearMonth: row.year_month, rate: Number(row.rate), source: row.source } as InccRate)))
    }
    const channel = client.channel('terra-shared-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'land_receipts' }, () => { void refresh() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incc_rates' }, () => { void refresh() })
      .subscribe()
    return () => { active = false; void client.removeChannel(channel) }
  }, [cloudEnabled, userEmail])

  useEffect(() => {
    if (cloudEnabled) return
    const storedReceipts = readArray<LandReceipt>(RECEIPTS_KEY)
    setLandReceipts(storedReceipts)
    const storedRates = readArray<InccRate>(RATES_KEY)
    setLocalDataCounts({ receipts: storedReceipts.length, rates: storedRates.length })
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
  }, [cloudEnabled])

  useEffect(() => {
    if (isLoaded && !cloudEnabled) localStorage.setItem(RECEIPTS_KEY, JSON.stringify(landReceipts))
  }, [isLoaded, landReceipts, cloudEnabled])

  useEffect(() => {
    if (isLoaded && !cloudEnabled) localStorage.setItem(RATES_KEY, JSON.stringify(inccRates))
  }, [isLoaded, inccRates, cloudEnabled])

  const supabase = useCallback((): SupabaseClient | null => cloudEnabled
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    : null, [cloudEnabled])

  const sendSignInLink = useCallback(async (email: string) => {
    const client = supabase()
    if (!client) return
    setAuthPending(true); setAuthError(null)
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } })
    setAuthPending(false)
    if (error) setAuthError(error.message)
  }, [supabase])

  const signOut = useCallback(async () => { await supabase()?.auth.signOut(); setUserEmail(null) }, [supabase])

  const importLocalData = useCallback(async () => {
    const client = supabase()
    if (!client) return
    const receipts = readArray<LandReceipt>(RECEIPTS_KEY)
    const rates = readArray<InccRate>(RATES_KEY)
    const [receiptResult, rateResult] = await Promise.all([
      receipts.length ? client.from('land_receipts').upsert(receipts.map(({ id, date, amount, type, year }) => ({ id, date, amount, type, year }))) : Promise.resolve({ error: null }),
      rates.length ? client.from('incc_rates').upsert(rates.map(({ yearMonth, rate, source }) => ({ year_month: yearMonth, rate, source })), { onConflict: 'year_month' }) : Promise.resolve({ error: null }),
    ])
    if (receiptResult.error || rateResult.error) { setDataError(receiptResult.error?.message ?? rateResult.error?.message ?? 'Falha ao importar.'); return }
    setLocalDataCounts({ receipts: 0, rates: 0 });
    const [{ data: remoteReceipts }, { data: remoteRates }] = await Promise.all([
      client.from('land_receipts').select('id,date,amount,type,year'), client.from('incc_rates').select('year_month,rate,source'),
    ])
    setLandReceipts((remoteReceipts ?? []).map((row) => ({ id: row.id, date: row.date, amount: Number(row.amount), type: row.type, year: row.year } as LandReceipt)))
    setInccRates((remoteRates ?? []).map((row) => ({ yearMonth: row.year_month, rate: Number(row.rate), source: row.source } as InccRate)))
    setDataError(null)
  }, [supabase])

  const addLandReceipt = useCallback(async (receipt: LandReceipt) => {
    if (cloudEnabled) {
      const { error } = await supabase()!.from('land_receipts').insert({ id: receipt.id, date: receipt.date, amount: receipt.amount, type: receipt.type, year: receipt.year })
      if (error) { setDataError(error.message); return }
    }
    setLandReceipts((current) => [...current, receipt])
    setDataError(null)
  }, [cloudEnabled, supabase])

  const removeLandReceipt = useCallback(async (id: string) => {
    if (cloudEnabled) {
      const { error } = await supabase()!.from('land_receipts').delete().eq('id', id)
      if (error) { setDataError(error.message); return }
    }
    setLandReceipts((current) => current.filter((receipt) => receipt.id !== id))
    setDataError(null)
  }, [cloudEnabled, supabase])

  const updateLandInccRates = useCallback(async (yearRates: InccRate[]) => {
    if (cloudEnabled) {
      const { error } = await supabase()!.from('incc_rates').upsert(yearRates.map(({ yearMonth, rate, source }) => ({ year_month: yearMonth, rate, source })), { onConflict: 'year_month' })
      if (error) { setDataError(error.message); return }
    }
    setInccRates((current) => {
      const next = [...current]
      for (const rate of yearRates) {
        const index = next.findIndex((entry) => entry.yearMonth === rate.yearMonth)
        if (index < 0) next.push(rate)
        else next[index] = rate
      }
      return next.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth))
    })
    setDataError(null)
  }, [cloudEnabled, supabase])

  return (
    <AppContext.Provider value={{ landReceipts, inccRates, isLoaded, cloudEnabled, userEmail, authPending, authError, sendSignInLink, signOut, importLocalData, localDataCounts, dataError, addLandReceipt, removeLandReceipt, updateLandInccRates }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
