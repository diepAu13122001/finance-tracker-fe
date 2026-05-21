import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { recurringService } from '@/services/recurringService'
import { CreateRecurringRequest, UpdateRecurringRequest } from '@/types/recurring'
import { notify } from '@/lib/toast'

const KEY = ['recurring'] as const

export const useRecurring = () =>
  useQuery({
    queryKey: KEY,
    queryFn: recurringService.getAll,
  })

export const useCreateRecurring = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateRecurringRequest) => recurringService.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      notify.success('Tạo giao dịch định kỳ thành công')
    },
    onError: () => notify.error('Tạo thất bại'),
  })
}

export const useUpdateRecurring = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateRecurringRequest }) =>
      recurringService.update(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      notify.success('Cập nhật thành công')
    },
    onError: () => notify.error('Cập nhật thất bại'),
  })
}

export const useDeleteRecurring = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recurringService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      notify.success('Xóa thành công')
    },
    onError: () => notify.error('Xóa thất bại'),
  })
}

export const useExecuteRecurring = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recurringService.execute(id),
    onSuccess: () => {
      // Invalidate cả transactions và recurring → UI cập nhật nextExecutionDate
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      notify.success('Ghi giao dịch thành công!')
    },
    onError: () => notify.error('Thực hiện thất bại'),
  })
}
