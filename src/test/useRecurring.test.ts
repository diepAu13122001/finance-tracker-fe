import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useRecurring, useCreateRecurring, useDeleteRecurring, useExecuteRecurring } from '@/hooks/useRecurring'
import { recurringService } from '@/services/recurringService'
import { RecurringTransaction } from '@/types/recurring'

vi.mock('@/services/recurringService')
vi.mock('@/lib/toast', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

const mockRecurringService = vi.mocked(recurringService)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: any) => createElement(QueryClientProvider, { client: qc }, children)
}

const fakeRecurring: RecurringTransaction = {
  id: 'rec-uuid-1',
  type: 'EXPENSE',
  amount: 500_000,
  note: 'Tiền điện',
  frequency: 'MONTHLY',
  nextExecutionDate: '2026-06-01',
  isActive: true,
}

describe('useRecurring hooks', () => {

  beforeEach(() => vi.clearAllMocks())

  it('useRecurring: fetch danh sách thành công', async () => {
    mockRecurringService.getAll.mockResolvedValueOnce([fakeRecurring])

    const { result } = renderHook(() => useRecurring(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].note).toBe('Tiền điện')
  })

  it('useCreateRecurring: gọi service + trả về dữ liệu mới', async () => {
    mockRecurringService.create.mockResolvedValueOnce(fakeRecurring)
    mockRecurringService.getAll.mockResolvedValueOnce([])

    const { result } = renderHook(() => useCreateRecurring(), { wrapper: createWrapper() })

    result.current.mutate({
      type: 'EXPENSE',
      amount: 500_000,
      note: 'Tiền điện',
      frequency: 'MONTHLY',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockRecurringService.create).toHaveBeenCalledOnce()
  })

  it('useDeleteRecurring: gọi delete + invalidate cache', async () => {
    mockRecurringService.delete.mockResolvedValueOnce(undefined)
    mockRecurringService.getAll.mockResolvedValueOnce([])

    const { result } = renderHook(() => useDeleteRecurring(), { wrapper: createWrapper() })

    result.current.mutate('rec-uuid-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockRecurringService.delete).toHaveBeenCalledWith('rec-uuid-1')
  })

  it('useExecuteRecurring: execute + invalidate cả recurring lẫn transactions', async () => {
    const txResponse = { id: 'tx-1', amount: 500_000, type: 'EXPENSE' }
    mockRecurringService.execute.mockResolvedValueOnce(txResponse as any)
    mockRecurringService.getAll.mockResolvedValueOnce([])

    const { result } = renderHook(() => useExecuteRecurring(), { wrapper: createWrapper() })

    result.current.mutate('rec-uuid-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockRecurringService.execute).toHaveBeenCalledWith('rec-uuid-1')
    expect(result.current.data?.amount).toBe(500_000)
  })
})
