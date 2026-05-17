import { useState } from 'react'
import { Trash2, Pencil, ArrowRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { DS } from '@/lib/design-system'
import { formatVND, formatRelativeDateVI } from '@/utils/format'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import type { TransactionResponse } from '@/types/transaction'

// Helper convert kebab-case → PascalCase cho lucide icons
const toPascalCase = (str: string): string =>
    str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')

interface TransactionItemProps {
    transaction: TransactionResponse
    onEdit: (transaction: TransactionResponse) => void
    /** Dùng trong drawer: ẩn date (đã hiển thị ở header) */
    hideDate?: boolean
}

export const TransactionItem = ({ transaction, onEdit, hideDate = false }: TransactionItemProps) => {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const deleteMutation = useDeleteTransaction()

    const isIncome = transaction.type === 'INCOME'
    const isTransfer = transaction.type === 'TRANSFER'
    const isExpense = transaction.type === 'EXPENSE'

    // ── Icon bên trái: ưu tiên category icon, fallback về type icon ───────────
    const CategoryIconComponent = transaction.category
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (Icons as any)[toPascalCase(transaction.category.icon)] || Icons.Tag
        : null

    const typeIconBg = isIncome
        ? 'bg-success-50'
        : isTransfer
            ? 'bg-amber-50'
            : 'bg-danger-50'

    const typeIconColor = isIncome
        ? '#22c55e'
        : isTransfer
            ? '#f59e0b'
            : '#ef4444'

    const categoryBg = transaction.category
        ? transaction.category.color + '18'  // 18 hex ≈ 10% opacity
        : typeIconBg

    const categoryColor = transaction.category
        ? transaction.category.color
        : typeIconColor

    // ── Nội dung text ─────────────────────────────────────────────────────────
    const description = transaction.note
        || (isIncome ? 'Thu nhập' : isTransfer ? 'Chuyển đổi' : 'Chi tiêu')

    // Dòng thứ 2: tên ví (hoặc "Nguồn → Đích" với transfer)
    const walletInfo = (() => {
        if (isTransfer && transaction.transferSourceWalletName && transaction.transferTargetWalletName) {
            return `${transaction.transferSourceWalletName} → ${transaction.transferTargetWalletName}`
        }
        return transaction.wallet?.name ?? null
    })()

    // ── Amount display ────────────────────────────────────────────────────────
    const amountClass = isIncome
        ? 'text-success-600'
        : isTransfer
            ? 'text-amber-600'
            : 'text-danger-600'

    const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-'

    // ── Delete logic ──────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true)
            setTimeout(() => setConfirmDelete(false), 3000)
            return
        }
        await deleteMutation.mutateAsync(transaction.id)
    }

    return (
        <div className="
            flex items-center gap-3 px-4 py-3
            hover:bg-surface-muted rounded-lg
            transition-all duration-150
            group
        ">
            {/* ── Trái: Category icon hoặc Type icon ── */}
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                    backgroundColor: categoryBg,
                    color: categoryColor,
                }}
            >
                {CategoryIconComponent ? (
                    <CategoryIconComponent size={18} />
                ) : isTransfer ? (
                    // Transfer icon: ⇄
                    <span className="text-sm font-bold">⇄</span>
                ) : isIncome ? (
                    <Icons.TrendingUp size={18} />
                ) : (
                    <Icons.TrendingDown size={18} />
                )}
            </div>

            {/* ── Giữa: Mô tả + Ví/Transfer info ── */}
            <div className="flex-1 min-w-0">
                {/* Dòng 1: Mô tả giao dịch */}
                <p className="text-sm font-medium text-text-primary truncate">
                    {description}
                </p>

                {/* Dòng 2: Tên ví hoặc "Nguồn → Đích" */}
                <div className="flex items-center gap-1 mt-0.5">
                    {isTransfer && transaction.transferSourceWalletName ? (
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                            <span>{transaction.transferSourceWalletName}</span>
                            <ArrowRight size={10} />
                            <span>{transaction.transferTargetWalletName}</span>
                        </div>
                    ) : walletInfo ? (
                        <span className="text-xs text-text-muted truncate">{walletInfo}</span>
                    ) : (
                        <span className="text-xs text-text-muted italic">Chưa có ví</span>
                    )}
                </div>
            </div>

            {/* ── Phải: Amount + Actions ── */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Amount */}
                <span className={`text-sm font-bold ${amountClass}`}>
                    {amountPrefix}{formatVND(transaction.amount)}
                </span>

                {/* Actions — chỉ hiện khi hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(transaction)}
                        className="p-1.5 rounded-md hover:bg-surface-border text-text-muted hover:text-text-primary transition-colors"
                        title="Sửa"
                    >
                        <Pencil size={13} />
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className={`
                            p-1.5 rounded-md text-text-muted transition-all duration-200
                            ${confirmDelete
                                ? 'bg-danger-500 text-white scale-110'
                                : 'hover:bg-surface-border hover:text-danger-500'
                            }
                        `}
                        title={confirmDelete ? 'Xác nhận xóa' : 'Xóa'}
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    )
}