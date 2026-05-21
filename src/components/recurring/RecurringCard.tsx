import { RecurringTransaction, FREQUENCY_LABELS, FREQUENCY_COLORS } from '@/types/recurring'
import { useDeleteRecurring, useExecuteRecurring, useUpdateRecurring } from '@/hooks/useRecurring'
import { formatVND } from '@/utils/format'

interface Props {
  recurring: RecurringTransaction
  onEdit: (r: RecurringTransaction) => void
}

/**
 * Hiển thị 1 giao dịch định kỳ:
 * - Badge frequency + loại (INCOME/EXPENSE)
 * - Ngày thực hiện tiếp theo
 * - Nút Execute (ghi giao dịch ngay) và Toggle active/inactive
 */
export const RecurringCard = ({ recurring, onEdit }: Props) => {
    const { mutate: execute, isPending: executing } = useExecuteRecurring()
    const { mutate: del, isPending: deleting } = useDeleteRecurring()
    const { mutate: update } = useUpdateRecurring()

    const isExpense = recurring.type === 'EXPENSE'
    const amountColor = isExpense ? 'text-red-600' : 'text-green-600'

    const toggleActive = () =>
        update({ id: recurring.id, req: { isActive: !recurring.isActive } })

    return (
        <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-opacity ${
            recurring.isActive ? 'border-border bg-surface' : 'border-border/50 bg-surface-muted opacity-60'
        }`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            FREQUENCY_COLORS[recurring.frequency]
                        }`}>
                            {FREQUENCY_LABELS[recurring.frequency]}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isExpense ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                            {isExpense ? 'Chi tiêu' : 'Thu nhập'}
                        </span>
                        {!recurring.isActive && (
                            <span className="text-xs text-text-muted">(Đã tắt)</span>
                        )}
                    </div>

                    {/* Tên / ghi chú */}
                    <p className="font-medium text-text-primary">
                        {recurring.note ?? 'Không có ghi chú'}
                    </p>

                    {/* Category + wallet */}
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                        {recurring.categoryName && <span>{recurring.categoryName}</span>}
                        {recurring.walletName && (
                            <>
                                {recurring.categoryName && <span>·</span>}
                                <span>{recurring.walletName}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Amount */}
                <p className={`font-semibold text-lg shrink-0 ${amountColor}`}>
                    {isExpense ? '-' : '+'}{formatVND(recurring.amount)}
                </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <p className="text-xs text-text-muted">
                    Lần sau: <span className="font-medium text-text-secondary">{recurring.nextExecutionDate}</span>
                </p>

                <div className="flex items-center gap-2">
                    {/* Toggle active */}
                    <button
                        onClick={toggleActive}
                        className="text-xs text-text-muted hover:text-text-primary underline transition-colors"
                    >
                        {recurring.isActive ? 'Tắt' : 'Bật'}
                    </button>

                    {/* Edit */}
                    <button
                        onClick={() => onEdit(recurring)}
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-surface-muted transition-colors"
                    >
                        Sửa
                    </button>

                    {/* Execute */}
                    {recurring.isActive && (
                        <button
                            onClick={() => execute(recurring.id)}
                            disabled={executing}
                            className="text-xs px-2 py-1 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {executing ? '...' : 'Ghi ngay'}
                        </button>
                    )}

                    {/* Delete */}
                    <button
                        onClick={() => {
                            if (confirm('Xóa giao dịch định kỳ này?')) del(recurring.id)
                        }}
                        disabled={deleting}
                        className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    )
}
