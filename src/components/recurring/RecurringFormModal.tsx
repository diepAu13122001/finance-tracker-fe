import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DS } from '@/lib/design-system'
import { useCreateRecurring, useUpdateRecurring } from '@/hooks/useRecurring'
import {
  RecurringTransaction,
  CreateRecurringRequest,
  Frequency,
  FREQUENCY_LABELS,
} from '@/types/recurring'

const schema = z.object({
  type:        z.enum(['INCOME', 'EXPENSE']),
  amount:      z.coerce.number().positive('Số tiền phải > 0'),
  note:        z.string().max(500).optional(),
  frequency:   z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate:   z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  editTarget?: RecurringTransaction | null
  onClose: () => void
}

export const RecurringFormModal = ({ editTarget, onClose }: Props) => {
    const { mutate: create, isPending: creating } = useCreateRecurring()
    const { mutate: update, isPending: updating } = useUpdateRecurring()
    const isPending = creating || updating

    const { register, handleSubmit, reset, formState: { errors } } =
        useForm<FormValues>({ resolver: zodResolver(schema) })

    useEffect(() => {
        if (editTarget) {
            reset({
                type:      editTarget.type,
                amount:    editTarget.amount,
                note:      editTarget.note ?? '',
                frequency: editTarget.frequency,
            })
        } else {
            reset({ type: 'EXPENSE', frequency: 'MONTHLY' })
        }
    }, [editTarget, reset])

    const onSubmit = (values: FormValues) => {
        if (editTarget) {
            update(
                { id: editTarget.id, req: { amount: values.amount, note: values.note } },
                { onSuccess: onClose }
            )
        } else {
            const req: CreateRecurringRequest = {
                type:      values.type,
                amount:    values.amount,
                note:      values.note,
                frequency: values.frequency as Frequency,
                startDate: values.startDate || undefined,
            }
            create(req, { onSuccess: onClose })
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className={DS.heading2}>
                        {editTarget ? 'Sửa giao dịch định kỳ' : 'Tạo giao dịch định kỳ'}
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">×</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">

                    {/* Type */}
                    {!editTarget && (
                        <div>
                            <label className={DS.label}>Loại</label>
                            <div className="flex p-1 bg-surface-muted rounded-lg mt-1">
                                {(['EXPENSE', 'INCOME'] as const).map(t => (
                                    <label key={t} className="flex-1 text-center">
                                        <input type="radio" value={t} {...register('type')} className="sr-only" />
                                        <span className={`block py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors`}>
                                            {t === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className={DS.label}>Số tiền (VND)</label>
                        <input type="number" {...register('amount')} className={`${DS.inputBase} mt-1`} placeholder="500000" />
                        {errors.amount && <p className={DS.error}>{errors.amount.message}</p>}
                    </div>

                    {/* Note */}
                    <div>
                        <label className={DS.label}>Ghi chú</label>
                        <input type="text" {...register('note')} className={`${DS.inputBase} mt-1`} placeholder="Tiền điện, Tiền nhà..." />
                    </div>

                    {/* Frequency — chỉ khi tạo mới */}
                    {!editTarget && (
                        <div>
                            <label className={DS.label}>Tần suất</label>
                            <select {...register('frequency')} className={`${DS.inputBase} mt-1`}>
                                {(Object.entries(FREQUENCY_LABELS) as [Frequency, string][]).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Start date — chỉ khi tạo mới */}
                    {!editTarget && (
                        <div>
                            <label className={DS.label}>Ngày bắt đầu (tùy chọn)</label>
                            <input type="date" {...register('startDate')} className={`${DS.inputBase} mt-1`} />
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className={`${DS.btnSecondary} flex-1`}>
                            Hủy
                        </button>
                        <button type="submit" disabled={isPending} className={`${DS.btnPrimary} flex-1`}>
                            {isPending ? 'Đang lưu...' : (editTarget ? 'Cập nhật' : 'Tạo')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
