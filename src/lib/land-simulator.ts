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

export interface LandSimulation {
  year: number
  receivedUpToYear: number
  pendingAmount: number
  inccAccumulated: number
  totalWithIncc: number
  breakdown: TerrainBreakdown[]
  yearTargets: YearTarget[]
}

export function getMonthlyInccRate(year: number, month: number, rates: InccRate[]): number {
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`
  return rates.find((rate) => rate.yearMonth === yearMonth)?.rate ?? DEFAULT_MONTHLY_INCC
}

/** The 12 monthly INCC rates compound on the unpaid balance at year end. */
export function getAnnualInccFactor(year: number, rates: InccRate[]): number {
  let factor = 1
  for (let month = 1; month <= 12; month += 1) {
    factor *= 1 + getMonthlyInccRate(year, month, rates) / 100
  }
  return factor
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
  const receipts = allReceipts.filter((receipt) => receipt.year <= year)
  let pendingD = LAND_TARGET_PER_LOT
  let pendingW = LAND_TARGET_PER_LOT

  for (let currentYear = FIRST_YEAR; currentYear <= year; currentYear += 1) {
    if (currentYear > FIRST_YEAR) {
      const priorYearFactor = getAnnualInccFactor(currentYear - 1, inccRates)
      pendingD *= priorYearFactor
      pendingW *= priorYearFactor
    }

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
    const receivedThisYear = receiptsInYear(allReceipts, targetYear)
    return {
      year: targetYear,
      minPercent: 0.15,
      min: LAND_ANNUAL_MINIMUM,
      receivedThisYear,
      met: receivedThisYear >= LAND_ANNUAL_MINIMUM,
    }
  })

  return {
    year,
    receivedUpToYear,
    pendingAmount,
    inccAccumulated,
    totalWithIncc: receivedUpToYear + pendingAmount,
    breakdown,
    yearTargets,
  }
}
