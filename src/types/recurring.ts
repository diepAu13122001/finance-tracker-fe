export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurringTransaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  note?: string
  categoryId?: string
  categoryName?: string
  categoryColor?: string
  walletId?: string
  walletName?: string
  frequency: Frequency
  dayOfMonth?: number
  dayOfWeek?: number
  nextExecutionDate: string // ISO date
  isActive: boolean
}

export interface CreateRecurringRequest {
  type: 'INCOME' | 'EXPENSE'
  amount: number
  note?: string
  categoryId?: string
  walletId?: string
  frequency: Frequency
  dayOfMonth?: number
  dayOfWeek?: number
  startDate?: string // ISO date
}

export interface UpdateRecurringRequest {
  amount?: number
  note?: string
  categoryId?: string
  walletId?: string
  isActive?: boolean
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  DAILY:   'Hàng ngày',
  WEEKLY:  'Hàng tuần',
  MONTHLY: 'Hàng tháng',
  YEARLY:  'Hàng năm',
}

export const FREQUENCY_COLORS: Record<Frequency, string> = {
  DAILY:   'bg-blue-100 text-blue-700',
  WEEKLY:  'bg-purple-100 text-purple-700',
  MONTHLY: 'bg-green-100 text-green-700',
  YEARLY:  'bg-orange-100 text-orange-700',
}
