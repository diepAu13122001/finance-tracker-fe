import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { DS } from '@/lib/design-system'
import { type TransactionType } from '@/types/transaction'
import { formatVND, parseSmartVNDInput } from '@/utils/format'
import { usePlan } from '@/hooks/usePlan'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { getErrorMessage, getErrorCode } from '@/utils/errorUtils'
import { animations } from '@/lib/animations'
import { CategorySelector } from '@/components/categories/CategorySelector'
import { PlanGate } from '@/components/shared/PlanGate'
import { WalletSelector } from '../wallets/WalletSelector'

const transactionSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    amount: z.string()
        .min(1, 'Số tiền không được để trống')
        .refine(val => parseSmartVNDInput(val) > 0, 'Số tiền phải lớn hơn 0'),
    note: z.string().optional(),
    transactionDate: z.string().min(1, 'Ngày không được để trống'),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface AddTransactionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    editData?: {
        id: string
        type: TransactionType
        amount: number
        note: string | null
        transactionDate: string
        categoryId?: string | null
        walletId?: string | null
    } | null
    defaultType?: TransactionType
    defaultCategoryId?: string | null
    defaultWalletId?: string | null
}

export const AddTransactionModal = ({
    isOpen,
    onClose,
    onSuccess,
    editData = null,
    defaultType = 'EXPENSE',
    defaultCategoryId = null,
    defaultWalletId = null,
}: AddTransactionModalProps) => {

    const { plan, isFree } = usePlan()

    const [serverError, setServerError] = useState<string | null>(null)
    const [categoryId, setCategoryId] = useState<string | null>(null)

    // walletId = nguồn tiền cho INCOME/EXPENSE, hoặc ví NGUỒN cho TRANSFER
    const [walletId, setWalletId] = useState<string | null>(null)
    // targetWalletId = ví ĐÍCH cho TRANSFER
    const [targetWalletId, setTargetWalletId] = useState<string | null>(null)

    const isEditMode = editData !== null

    const createMutation = useCreateTransaction()
    const updateMutation = useUpdateTransaction()

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: editData?.type ?? defaultType,
            amount: '',
            note: '',
            transactionDate: new Date().toISOString().split('T')[0],
        },
    })

    const selectedType = watch('type')

    useEffect(() => {
        if (!isOpen) return

        const initialType = editData?.type ?? defaultType
        reset({
            type: initialType,
            amount: editData?.amount ? editData.amount.toLocaleString('vi-VN') : '',
            note: editData?.note ?? '',
            transactionDate: editData?.transactionDate ?? new Date().toISOString().split('T')[0],
        })
        setValue('type', initialType)
        setCategoryId(editData?.categoryId ?? defaultCategoryId ?? null)
        setWalletId(editData?.walletId ?? defaultWalletId ?? null)
        setTargetWalletId(null)
        setServerError(null)
    }, [isOpen, editData, defaultType, defaultCategoryId, defaultWalletId, reset, setValue])

    // Reset category khi đổi type (chỉ create mode)
    useEffect(() => {
        if (!isEditMode) setCategoryId(null)
    }, [selectedType, isEditMode])

    const onSubmit = async (data: TransactionFormData) => {
        setServerError(null)

        // Validate TRANSFER cần cả 2 ví
        if (data.type === 'TRANSFER') {
            if (!walletId) {
                setServerError('Vui lòng chọn ví nguồn')
                return
            }
            if (!targetWalletId) {
                setServerError('Vui lòng chọn ví đích')
                return
            }
            if (walletId === targetWalletId) {
                setServerError('Ví nguồn và ví đích không thể giống nhau')
                return
            }
        }

        const payload = {
            type: data.type as TransactionType,
            amount: parseSmartVNDInput(data.amount),
            note: data.note || undefined,
            transactionDate: data.transactionDate,
            categoryId: categoryId || undefined,
            walletId: walletId || undefined,
            targetWalletId: data.type === 'TRANSFER' ? (targetWalletId || undefined) : undefined,
        }

        try {
            if (isEditMode && editData) {
                await updateMutation.mutateAsync({ id: editData.id, payload })
            } else {
                await createMutation.mutateAsync(payload)
            }
            reset()
            setCategoryId(null)
            setWalletId(null)
            setTargetWalletId(null)
            onSuccess()
            onClose()
        } catch (error: unknown) {
            const code = getErrorCode(error)
            const message = getErrorMessage(error, 'Có lỗi xảy ra, vui lòng thử lại')

            if (code === 'PLAN_UPGRADE_REQUIRED') {
                setServerError('Bạn đã đạt giới hạn 50 giao dịch/tháng.')
            } else {
                setServerError(message)
            }
        }
    }

    if (!isOpen) return null

    const isTransfer = selectedType === 'TRANSFER'

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className={`
                ${DS.card} w-full sm:max-w-md
                rounded-t-2xl sm:rounded-xl
                max-h-[90vh] overflow-y-auto
                ${animations.slideInBottom} sm:${animations.scaleIn}
            `}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className={DS.heading2}>
                        {isEditMode ? 'Sửa giao dịch' : 'Thêm giao dịch'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-muted text-text-muted">
                        <X size={20} />
                    </button>
                </div>

                {isFree && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                        <p className="text-xs text-amber-700">
                            ⚠ Gói <strong>Miễn phí</strong> giới hạn 50 giao dịch/tháng.{' '}
                            <a href="/pricing" className="underline font-medium">Nâng cấp Plus</a>
                        </p>
                    </div>
                )}

                {serverError && (
                    <div className="bg-danger-50 border border-danger-500 rounded-lg px-4 py-3 mb-4">
                        <p className="text-sm text-danger-600">{serverError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

                    {/* Toggle INCOME / EXPENSE / TRANSFER */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-surface-muted rounded-lg">
                        {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setValue('type', type)}
                                className={`
                                    py-2 rounded-md text-sm font-medium transition-all
                                    ${selectedType === type
                                        ? type === 'INCOME' ? 'bg-success-500 text-white shadow-sm'
                                            : type === 'TRANSFER' ? 'bg-amber-400 text-white shadow-sm'
                                                : 'bg-danger-500 text-white shadow-sm'
                                        : 'text-text-secondary hover:text-text-primary'
                                    }
                                `}
                            >
                                {type === 'INCOME' ? '↑ Thu nhập'
                                    : type === 'TRANSFER' ? '⇄ Chuyển'
                                        : '↓ Chi tiêu'}
                            </button>
                        ))}
                    </div>

                    {/* Amount */}
                    <div>
                        <Input
                            label="Số tiền (VND)"
                            type="text"
                            placeholder="45.000"
                            error={errors.amount?.message}
                            {...register('amount')}
                            onBlur={(e) => {
                                const parsed = parseSmartVNDInput(e.target.value)
                                if (parsed > 0) setValue('amount', parsed.toLocaleString('vi-VN'))
                            }}
                        />
                        {watch('amount') && parseSmartVNDInput(watch('amount')) > 0 && (
                            <p className="text-xs text-text-muted mt-1">
                                = {formatVND(parseSmartVNDInput(watch('amount')))}
                            </p>
                        )}
                    </div>

                    {/* Note */}
                    <Input
                        label="Ghi chú"
                        placeholder={isTransfer ? 'Chuyển tiền trả nợ...' : 'Cà phê Highlands...'}
                        error={errors.note?.message}
                        {...register('note')}
                    />

                    {/* Category — chỉ cho INCOME/EXPENSE */}
                    {!isTransfer && (
                        <PlanGate requires="PLUS" fallback={null}>
                            <CategorySelector
                                value={categoryId}
                                onChange={setCategoryId}
                                type={selectedType as 'INCOME' | 'EXPENSE'}
                            />
                        </PlanGate>
                    )}

                    {/* ── Wallet selectors ─────────────────────────────── */}
                    {isTransfer ? (
                        /* TRANSFER: cần ví nguồn và ví đích */
                        <div className="flex flex-col gap-3">
                            <WalletSelector
                                value={walletId}
                                onChange={setWalletId}
                                required={true}
                                label="Ví nguồn (chuyển đi)"
                                error={!walletId && isSubmitting ? 'Chọn ví nguồn' : undefined}
                            />
                            <WalletSelector
                                value={targetWalletId}
                                onChange={setTargetWalletId}
                                required={true}
                                label="Ví đích (nhận về)"
                                excludeWalletId={walletId || undefined}
                                error={!targetWalletId && isSubmitting ? 'Chọn ví đích' : undefined}
                            />
                        </div>
                    ) : (
                        /* INCOME/EXPENSE: 1 ví */
                        <WalletSelector
                            value={walletId}
                            onChange={setWalletId}
                            required={false}
                        />
                    )}

                    {/* Date */}
                    <Input
                        label="Ngày"
                        type="date"
                        error={errors.transactionDate?.message}
                        {...register('transactionDate')}
                    />

                    {/* Buttons */}
                    <div className="flex gap-3 mt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant={
                                selectedType === 'INCOME' ? 'primary'
                                    : selectedType === 'TRANSFER' ? 'ghost'
                                        : 'danger'
                            }
                            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                            className={`flex-1 ${selectedType === 'TRANSFER' ? '!bg-amber-400 !text-white hover:!bg-amber-500' : ''}`}
                        >
                            {isEditMode ? 'Cập nhật'
                                : selectedType === 'INCOME' ? 'Thêm thu nhập'
                                    : selectedType === 'TRANSFER' ? 'Xác nhận chuyển'
                                        : 'Thêm chi tiêu'}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    )
}