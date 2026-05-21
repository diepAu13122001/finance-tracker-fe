import { api } from '@/lib/api'
import {
  RecurringTransaction,
  CreateRecurringRequest,
  UpdateRecurringRequest,
} from '@/types/recurring'
import { TransactionResponse } from '@/types/transaction'

export const recurringService = {
  getAll: async (): Promise<RecurringTransaction[]> => {
    const { data } = await api.get<RecurringTransaction[]>('/api/recurring')
    return data
  },

  create: async (req: CreateRecurringRequest): Promise<RecurringTransaction> => {
    const { data } = await api.post<RecurringTransaction>('/api/recurring', req)
    return data
  },

  update: async (id: string, req: UpdateRecurringRequest): Promise<RecurringTransaction> => {
    const { data } = await api.put<RecurringTransaction>(`/api/recurring/${id}`, req)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/recurring/${id}`)
  },

  /** Thực hiện ngay và đẩy nextExecutionDate lên */
  execute: async (id: string): Promise<TransactionResponse> => {
    const { data } = await api.post<TransactionResponse>(`/api/recurring/${id}/execute`)
    return data
  },
}
