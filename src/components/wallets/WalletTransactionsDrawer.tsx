import { useState } from 'react'
import { X, Plus, ArrowRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { DS } from '@/lib/design-system'
import { useTransactionsByWallet } from '@/hooks/useWallets'
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal'
import { formatVND, formatRelativeDateVI } from '@/utils/format'
import type { WalletResponse } from '@/types/wallet'
import { WALLET_TYPE_CONFIG } from '@/types/wallet'

const toPascalCase = (s: string) =>
    s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

interface WalletTransactionsDrawerProps {
    wallet: WalletResponse | null   // null = đóng drawer
    onClose: () => void
}

export const WalletTransactionsDrawer = ({
    wallet,
    onClose,
}: WalletTransactionsDrawerProps) => {

    const [page, setPage] = useState(0)
    const [isModalOpen, setIsModal] = useState(false)

    const isOpen = wallet !== null

    const { data, isLoading } = useTransactionsByWallet(
        wallet?.id ?? '',
        page,
        isOpen
    )

    const IconComponent = wallet
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? ((Icons as any)[toPascalCase(wallet.icon)] || Icons.Wallet)
        : Icons.Wallet

    const config = wallet ? WALLET_TYPE_CONFIG[wallet.type] : null

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 z-40
                    bg-black/40 backdrop-blur-sm
                    transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
            />

            {/* Drawer — slide từ phải */}
            <div
                className={`
                    fixed top-0 right-0 z-50
                    h-full w-full sm:w-[420px]
                    bg-surface shadow-2xl
                    flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* Header */}
                <div className="flex-shrink-0 border-b border-surface-border">
                    {wallet && (
                        <div className="flex items-center gap-3 px-5 py-4">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    backgroundColor: wallet.color + '25',
                                    color: wallet.color,
                                }}
                            >
                                <IconComponent size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-text-primary truncate">
                                    {wallet.name}
                                </div>
                                <div className="text-xs text-text-muted flex items-center gap-1.5">
                                    <span>{config?.label}</span>
                                    {wallet.status === 'CANCELLED' && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-surface-muted text-text-muted font-medium">
                                            Đã đóng
                                        </span>
                                    )}
                                    {wallet.type === 'NORMAL' && (
                                        <span
                                            className={`font-semibold ${wallet.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}
                                        >
                                            · {formatVND(wallet.balance)}
                                        </span>
                                    )}
                                    {wallet.type === 'DEBT' && (
                                        <span className="font-semibold text-danger-600">
                                            · Nợ {formatVND(wallet.currentAmount)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Nút thêm giao dịch — chỉ cho ví còn ACTIVE */}
                            {wallet.status === 'ACTIVE' && (
                                <button
                                    onClick={() => setIsModal(true)}
                                    className="
                                        flex-shrink-0 w-8 h-8 rounded-lg
                                        flex items-center justify-center
                                        bg-primary-50 text-primary-600
                                        hover:bg-primary-100 transition-colors
                                    "
                                    aria-label="Thêm giao dịch"
                                >
                                    <Plus size={16} />
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-surface-muted text-text-muted"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content — scrollable */}
                <div className="flex-1 overflow-y-auto">

                    {isLoading && (
                        <div className="flex items-center justify-center h-32 text-text-muted text-sm">
                            Đang tải...
                        </div>
                    )}

                    {!isLoading && data?.empty && (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: wallet?.color + '20', color: wallet?.color }}
                            >
                                <IconComponent size={28} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-text-primary">
                                    Chưa có giao dịch
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    {wallet?.status === 'ACTIVE'
                                        ? 'Thêm giao dịch cho nguồn tiền này'
                                        : 'Ví này đã đóng, không có giao dịch nào'}
                                </p>
                            </div>
                            {wallet?.status === 'ACTIVE' && (
                                <button
                                    onClick={() => setIsModal(true)}
                                    className="
                                        mt-1 px-4 py-2 rounded-lg text-sm font-semibold
                                        text-white transition-opacity hover:opacity-85
                                    "
                                    style={{ backgroundColor: wallet?.color }}
                                >
                                    Thêm giao dịch
                                </button>
                            )}
                        </div>
                    )}

                    {/* Transaction list */}
                    {!isLoading && data && !data.empty && (
                        <div className="divide-y divide-surface-border">
                            {data.content.map(tx => {
                                const isIncome = tx.type === 'INCOME' || tx.source === 'transfer_in'
                                const isTransfer = tx.type === 'TRANSFER'
                                const isExpense = tx.type === 'EXPENSE' || tx.source === 'transfer_out'

                                const amountColor = tx.source === 'transfer_in' || tx.type === 'INCOME'
                                    ? 'text-success-600'
                                    : tx.source === 'transfer_out'
                                        ? 'text-amber-600'
                                        : 'text-danger-600'

                                const prefix = tx.source === 'transfer_in' || tx.type === 'INCOME' ? '+' : '-'

                                return (
                                    <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-muted transition-colors">
                                        {/* Type indicator */}
                                        <div className={`
                                            flex-shrink-0 w-9 h-9 rounded-full
                                            flex items-center justify-center text-xs font-bold
                                            ${tx.source === 'transfer_in' ? 'bg-success-50 text-success-600'
                                                : tx.source === 'transfer_out' ? 'bg-amber-50 text-amber-600'
                                                : tx.type === 'INCOME' ? 'bg-success-50 text-success-600'
                                                : 'bg-danger-50 text-danger-600'}
                                        `}>
                                            {tx.source === 'transfer_in' ? '↙' : tx.source === 'transfer_out' ? '↗' : tx.type === 'INCOME' ? '↑' : '↓'}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-text-primary truncate">
                                                {tx.note || (tx.type === 'INCOME' ? 'Thu nhập' : tx.type === 'TRANSFER' ? 'Chuyển tiền' : 'Chi tiêu')}
                                            </div>
                                            {/* Transfer: show source → target */}
                                            {isTransfer && tx.transferSourceWalletName ? (
                                                <div className="flex items-center gap-1 text-xs text-text-muted">
                                                    <span>{tx.transferSourceWalletName}</span>
                                                    <ArrowRight size={10} />
                                                    <span>{tx.transferTargetWalletName}</span>
                                                    <span>·</span>
                                                    <span>{formatRelativeDateVI(tx.transactionDate)}</span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-text-muted">
                                                    {formatRelativeDateVI(tx.transactionDate)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Amount */}
                                        <div className={`flex-shrink-0 text-sm font-semibold ${amountColor}`}>
                                            {prefix}{formatVND(tx.amount)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && data && data.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 px-5 py-4 border-t border-surface-border">
                            <button
                                onClick={() => setPage(p => p - 1)}
                                disabled={data.first}
                                className="px-3 py-1.5 text-sm rounded-lg border border-surface-border disabled:opacity-40 hover:bg-surface-muted transition-colors"
                            >
                                ← Trước
                            </button>
                            <span className="text-xs text-text-muted font-mono">
                                {page + 1} / {data.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={data.last}
                                className="px-3 py-1.5 text-sm rounded-lg border border-surface-border disabled:opacity-40 hover:bg-surface-muted transition-colors"
                            >
                                Tiếp →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Transaction Modal — pre-fill wallet */}
            {wallet && (
                <AddTransactionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModal(false)}
                    onSuccess={() => setIsModal(false)}
                    defaultType="EXPENSE"
                    defaultWalletId={wallet.id}
                    editData={null}
                />
            )}
        </>
    )
}
