import type { InccRate, LandReceipt } from '@/types'

export const LAND_TARGET_PER_LOT = 180000
export const LAND_TOTAL_TARGET = LAND_TARGET_PER_LOT * 2
export const LAND_ANNUAL_MINIMUM = LAND_TOTAL_TARGET * 0.15
export const DEFAULT_MONTHLY_INCC = 0.5
export const FIRST_YEAR = 2026
export const LAST_YEAR = 2030
export const LAND_YEARS = Array.from(
  { length: LAST_YEAR - FIRST_YEAR + 1 },
  (_, index) => FIRST_YEAR + index
)

const ANNUAL_LATE_FEE_RATE = 0.02
const MONTHLY_LATE_INTEREST_RATE = 0.01
const FINAL_COMPENSATORY_FINE_RATE = 0.10

export interface TerrainBreakdown {
  terrain: 'D' | 'W'
  received: number
  baseTarget: number
  inccApplied: number
  correctedTarget: number
  pending: number
  baseRemaining: number
}

export interface YearTarget {
  year: number
  minPercent: number
  min: number
  receivedThisYear: number
  met: boolean
}

export interface LandYearProjection {
  year: number
  receivedThisYear: number
  annualMinimum: number
  met: boolean
  totalDueAtYearEnd: number
}

export interface AnnualLateCharge {
  year: number
  shortfallAtClose: number
  latePrincipalRemaining: number
  penalty: number
  interest: number
}

export interface LandSimulation {
  year: number
  asOfDate: string
  receivedUpToYear: number
  pendingAmount: number
  inccAccumulated: number
  totalWithIncc: number
  annualLateCharges: AnnualLateCharge[]
  latePrincipalOutstanding: number
  latePenalty: number
  lateInterest: number
  finalPenalty: number
  conditionalCompensatoryPenalty: number
  totalDueWithCharges: number
  breakdown: TerrainBreakdown[]
  yearTargets: YearTarget[]
}

export function getMonthlyInccRate(year: number, month: number, rates: InccRate[]): number {
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`
  return rates.find((rate) => rate.yearMonth === yearMonth)?.rate ?? DEFAULT_MONTHLY_INCC
}

/** Monthly rates are added, then applied once to the unpaid balance at year end. */
export function getAnnualInccFactor(year: number, rates: InccRate[]): number {
  let annualPercent = 0
  for (let month = 1; month <= 12; month += 1) {
    annualPercent += getMonthlyInccRate(year, month, rates)
  }
  return Math.max(0, 1 + annualPercent / 100)
}

function totalReceived(receipts: LandReceipt[], terrain: 'D' | 'W', throughYear: number): number {
  return receipts
    .filter((receipt) => receipt.type === terrain && receipt.year <= throughYear)
    .reduce((sum, receipt) => sum + receipt.amount, 0)
}

function receiptsInYear(receipts: LandReceipt[], year: number): number {
  return receipts
    .filter((receipt) => receipt.year === year)
    .reduce((sum, receipt) => sum + receipt.amount, 0)
}

interface LateChargeBucket {
  year: number
  shortfallAtClose: number
  latePrincipalRemaining: number
  penalty: number
  interest: number
}

function utcDayNumber(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

function dayAfter(date: string): string {
  const nextDay = new Date(utcDayNumber(date) * 86_400_000 + 86_400_000)
  return nextDay.toISOString().slice(0, 10)
}

function accrueLateInterest(buckets: LateChargeBucket[], fromDate: string, throughDate: string): void {
  const days = Math.max(0, utcDayNumber(throughDate) - utcDayNumber(fromDate) + 1)
  if (days === 0) return

  for (const bucket of buckets) {
    bucket.interest += bucket.latePrincipalRemaining * MONTHLY_LATE_INTEREST_RATE * days / 30
  }
}

function applyReceiptToOldestLatePrincipal(buckets: LateChargeBucket[], amount: number): void {
  let remaining = amount
  for (const bucket of buckets) {
    const applied = Math.min(bucket.latePrincipalRemaining, remaining)
    bucket.latePrincipalRemaining -= applied
    remaining -= applied
    if (remaining <= 0) break
  }
}

function simulateAnnualLateCharges(
  throughYear: number,
  receipts: LandReceipt[],
  inccRates: InccRate[],
  asOfDate: string
): AnnualLateCharge[] {
  const buckets: LateChargeBucket[] = []
  let balanceD = LAND_TARGET_PER_LOT
  let balanceW = LAND_TARGET_PER_LOT

  for (let year = FIRST_YEAR; year <= throughYear; year += 1) {
    const yearStart = `${year}-01-01`
    const yearEnd = year === LAST_YEAR ? asOfDate : `${year}-12-31`

    // A prior-year shortfall is part of the unpaid balance carried into January.
    if (year > FIRST_YEAR) {
      const priorYearFactor = getAnnualInccFactor(year - 1, inccRates)
      balanceD *= priorYearFactor
      balanceW *= priorYearFactor
      for (const bucket of buckets) {
        bucket.latePrincipalRemaining *= priorYearFactor
      }
    }

    const yearReceipts = receipts
      .filter((receipt) => receipt.year === year && receipt.date <= yearEnd)
      .sort((a, b) => a.date.localeCompare(b.date))

    const annualMinimum = (balanceD + balanceW) * 0.15
    for (const receipt of yearReceipts) {
      if (receipt.type === 'D') balanceD = Math.max(0, balanceD - receipt.amount)
      else balanceW = Math.max(0, balanceW - receipt.amount)
    }

    let interestCursor = yearStart
    for (const receipt of yearReceipts) {
      accrueLateInterest(buckets, interestCursor, receipt.date)
      applyReceiptToOldestLatePrincipal(buckets, receipt.amount)
      interestCursor = dayAfter(receipt.date)
    }
    accrueLateInterest(buckets, interestCursor, yearEnd)

    // In 2030 the full balance is due on December 30, so the final-balance
    // default calculation replaces another annual-minimum shortfall bucket.
    if (year < LAST_YEAR && year < throughYear) {
      const shortfallAtClose = Math.max(0, annualMinimum - receiptsInYear(yearReceipts, year))
      if (shortfallAtClose > 0) {
        buckets.push({
          year,
          shortfallAtClose,
          latePrincipalRemaining: shortfallAtClose,
          penalty: shortfallAtClose * ANNUAL_LATE_FEE_RATE,
          interest: 0,
        })
      }
    }
  }

  return buckets.map(({ year, shortfallAtClose, latePrincipalRemaining, penalty, interest }) => ({
    year,
    shortfallAtClose,
    latePrincipalRemaining,
    penalty,
    interest,
  }))
}

/**
 * Replays each contract year in order. A year's rates are accumulated while
 * that year is in progress, then compound onto each lot's remaining balance
 * at the start of the following year.
 */
export function simulateLandYear(
  targetYear: number,
  allReceipts: LandReceipt[],
  inccRates: InccRate[]
): LandSimulation {
  const year = Math.min(LAST_YEAR, Math.max(FIRST_YEAR, targetYear))
  const asOfDate = year === LAST_YEAR ? '2030-12-30' : `${year}-12-31`
  const receipts = allReceipts.filter((receipt) => receipt.year <= year && receipt.date <= asOfDate)
  let pendingD = LAND_TARGET_PER_LOT
  let pendingW = LAND_TARGET_PER_LOT
  const annualMinimumByYear = new Map<number, number>()

  for (let currentYear = FIRST_YEAR; currentYear <= year; currentYear += 1) {
    if (currentYear > FIRST_YEAR) {
      const priorYearFactor = getAnnualInccFactor(currentYear - 1, inccRates)
      pendingD *= priorYearFactor
      pendingW *= priorYearFactor
    }

    const totalAtStartOfYear = pendingD + pendingW
    annualMinimumByYear.set(currentYear, totalAtStartOfYear * 0.15)

    const paidD = receipts
      .filter((receipt) => receipt.type === 'D' && receipt.year === currentYear)
      .reduce((sum, receipt) => sum + receipt.amount, 0)
    const paidW = receipts
      .filter((receipt) => receipt.type === 'W' && receipt.year === currentYear)
      .reduce((sum, receipt) => sum + receipt.amount, 0)

    // Receipts reduce only the lot they identify. An excess receipt remains
    // visible in the ledger and annual total, while the balance floors at zero.
    pendingD = Math.max(0, pendingD - paidD)
    pendingW = Math.max(0, pendingW - paidW)
  }

  const receivedD = totalReceived(receipts, 'D', year)
  const receivedW = totalReceived(receipts, 'W', year)
  const baseRemainingD = Math.max(0, LAND_TARGET_PER_LOT - receivedD)
  const baseRemainingW = Math.max(0, LAND_TARGET_PER_LOT - receivedW)
  const receivedUpToYear = receivedD + receivedW
  const pendingAmount = pendingD + pendingW
  const inccAccumulated = Math.max(0, pendingD - baseRemainingD) + Math.max(0, pendingW - baseRemainingW)
  const annualLateCharges = simulateAnnualLateCharges(year, receipts, inccRates, asOfDate)
  const latePrincipalOutstanding = annualLateCharges.reduce((sum, charge) => sum + charge.latePrincipalRemaining, 0)
  const latePenalty = annualLateCharges.reduce((sum, charge) => sum + charge.penalty, 0)
  const lateInterest = annualLateCharges.reduce((sum, charge) => sum + charge.interest, 0)
  const finalPenalty = year === LAST_YEAR ? pendingAmount * ANNUAL_LATE_FEE_RATE : 0
  const conditionalCompensatoryPenalty = year === LAST_YEAR && pendingAmount > 0
    ? LAND_TOTAL_TARGET * FINAL_COMPENSATORY_FINE_RATE
    : 0

  const breakdown: TerrainBreakdown[] = [
    {
      terrain: 'D',
      received: receivedD,
      baseTarget: LAND_TARGET_PER_LOT,
      inccApplied: Math.max(0, pendingD - baseRemainingD),
      correctedTarget: receivedD + pendingD,
      pending: pendingD,
      baseRemaining: baseRemainingD,
    },
    {
      terrain: 'W',
      received: receivedW,
      baseTarget: LAND_TARGET_PER_LOT,
      inccApplied: Math.max(0, pendingW - baseRemainingW),
      correctedTarget: receivedW + pendingW,
      pending: pendingW,
      baseRemaining: baseRemainingW,
    },
  ]

  const yearTargets = LAND_YEARS.map((targetYear) => {
    const receivedThisYear = receiptsInYear(receipts, targetYear)
    return {
      year: targetYear,
      minPercent: 0.15,
      min: annualMinimumByYear.get(targetYear) ?? LAND_ANNUAL_MINIMUM,
      receivedThisYear,
      met: receivedThisYear >= (annualMinimumByYear.get(targetYear) ?? LAND_ANNUAL_MINIMUM),
    }
  })

  return {
    year,
    asOfDate,
    receivedUpToYear,
    pendingAmount,
    inccAccumulated,
    totalWithIncc: receivedUpToYear + pendingAmount,
    annualLateCharges,
    latePrincipalOutstanding,
    latePenalty,
    lateInterest,
    finalPenalty,
    conditionalCompensatoryPenalty,
    totalDueWithCharges: pendingAmount + latePenalty + lateInterest + finalPenalty,
    breakdown,
    yearTargets,
  }
}
