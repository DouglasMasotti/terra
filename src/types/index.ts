export interface InccRate {
  yearMonth: string
  rate: number
  source: 'auto' | 'manual'
}

export interface LandReceipt {
  id: string
  date: string
  amount: number
  type: 'D' | 'W'
  year: number
  receivedBy?: 'Douglas' | 'William'
}
