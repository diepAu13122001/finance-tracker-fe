import { useState } from 'react'
import { Pencil, Trash2, Ban, AlertTriangle, ChevronRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { DS } from '@/lib/design-system'
import { useCancelWallet, useDeleteWallet } from '@/hooks/useWallets'
import { WALLET_TYPE_CONFIG } from '@/types/wallet'
import type { WalletResponse } from '@/types/wallet'
import { formatVND } from '@/utils/format'

const toPascalCase = (s: string) =>
    s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

interface WalletCardProps {
    wallet: WalletResponse
    onEdit: () => void
    onClick?: () => void  // mở drawer xem transactions
}

export const WalletCard = ({ wallet, onEdit, onClick }: WalletCardProps) => {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const cancelMutation = useCancelWallet()
    const deleteMutation = useDeleteWallet()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (Icons as any)[toPascalCase(wallet.icon)] || Icons.Wallet
    const config = WALLET_TYPE_CONFIG[wallet.type]
    const isDebtDanger = wallet.type === 'DEBT' && wallet.overLimit
    const isCancelled = wallet.status === 'CANCELLED'
    const isInstallment = wallet.type === 'DEBT' && wallet.subtype === 'INSTALLMENT'

    const handleCardClick = () => {
        if (onClick) onClick()
    }

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (window.confirm(`Đóng "${wallet.name}"?\n\nVí đã đóng vẫn giữ lịch sử giao dịch và được tính vào giới hạn 5 ví của gói Free.`)) {
            cancelMutation.mutate(wallet.id)
        }
    }

    return (
        <div
            className={`
                ${DS.card} flex flex-col gap-3
                transition-all hover:shadow-md
                ${onClick ? 'cursor-pointer hover:border-primary-200' : ''}
                ${isDebtDanger ? 'border-danger-300 bg-danger-50/30' : ''}
                ${isCancelled ? 'opacity-70 bg-surface-muted' : ''}
            `}
            onClick={handleCardClick}
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                        backgroundColor: isDebtDanger ? '#fef2f2' : wallet.color + '20',
                        color: isDebtDanger ? '#ef4444' : wallet.color,
                    }}
                >
                    <IconComponent size={20} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-text-primary truncate">{wallet.name}</span>
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${config.bgClass}`}
                            style={{ color: config.color }}
                        >
                            {config.label}
                            {isInstallment && ' · Trả góp'}
                        </span>
                        {isCancelled && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-surface-muted text-text-muted">
                                Đã đóng
                            </span>
                        )}
                        {isDebtDanger && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-danger-100 text-danger-700 flex items-center gap-1">
                                <AlertTriangle size={10} /> Vượt hạn mức!
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {!isCancelled && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit() }}
                                className="p-1.5 rounded-md text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors"
                                title="Sửa"
                            >
                                <Pencil size={13} />
                            </button>
                            <button
                                onClick={handleClose}
                                disabled={cancelMutation.isPending}
                                className="p-1.5 rounded-md text-text-muted hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                title="Đóng ví"
                            >
                                <Ban size={13} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!confirmDelete) {
                                setConfirmDelete(true)
                                setTimeout(() => setConfirmDelete(false), 3000)
                                return
                            }
                            deleteMutation.mutate(wallet.id)
                        }}
                        disabled={deleteMutation.isPending}
                        title={confirmDelete ? 'Xác nhận xóa vĩnh viễn' : 'Xóa ví'}
                        className={`p-1.5 rounded-md transition-all ${confirmDelete ? 'bg-danger-500 text-white scale-110' : 'text-text-muted hover:text-danger-500'}`}
                    >
                        <Trash2 size={13} />
                    </button>
                    {onClick && !isCancelled && (
                        <ChevronRight size={14} className="text-text-muted ml-1" />
                    )}
                </div>
            </div>

            {/* Body */}
            {/* NORMAL wallet */}
            {wallet.type === 'NORMAL' && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Số dư hiện tại</span>
                    <span className={`text-base font-bold ${wallet.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {wallet.balance < 0 ? '−' : ''}{formatVND(Math.abs(wallet.balance))}
                    </span>
                </div>
            )}

            {/* DEBT CREDIT_CARD */}
            {wallet.type === 'DEBT' && !isInstallment && !isCancelled && (
                <>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">
                            Đã dùng: {formatVND(wallet.currentAmount)}
                            {wallet.creditLimit ? ` / ${formatVND(wallet.creditLimit)}` : ''}
                        </span>
                        <span className={`font-bold ${isDebtDanger ? 'text-danger-600' : ''}`}
                            style={!isDebtDanger ? { color: wallet.color } : undefined}>
                            {wallet.progressPercent.toFixed(0)}%
                        </span>
                    </div>
                    {wallet.creditLimit && (
                        <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(wallet.progressPercent, 100)}%`,
                                    backgroundColor: isDebtDanger ? '#ef4444' : wallet.color,
                                }}
                            />
                        </div>
                    )}
                    {wallet.billingDate && (
                        <div className="text-xs text-text-muted">Đáo hạn ngày {wallet.billingDate} hàng tháng</div>
                    )}
                    {isDebtDanger && (
                        <div className="flex items-center gap-2 bg-danger-100 rounded-lg px-3 py-2">
                            <AlertTriangle size={14} className="text-danger-600 flex-shrink-0" />
                            <p className="text-xs text-danger-700 font-medium">
                                Vượt hạn mức {formatVND(wallet.currentAmount - (wallet.creditLimit ?? 0))}!
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* DEBT INSTALLMENT */}
            {wallet.type === 'DEBT' && isInstallment && !isCancelled && (
                <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-surface-muted rounded-lg px-2 py-1.5">
                            <div className="text-text-muted">Mỗi kỳ</div>
                            <div className="font-bold text-danger-600">
                                {wallet.monthlyPayment ? formatVND(wallet.monthlyPayment) : '—'}
                            </div>
                        </div>
                        <div className="bg-surface-muted rounded-lg px-2 py-1.5">
                            <div className="text-text-muted">Đã trả</div>
                            <div className="font-bold text-success-600">{formatVND(wallet.currentAmount)}</div>
                        </div>
                    </div>
                    {wallet.initialAmount && (
                        <div className="text-xs text-text-muted">
                            Vay ban đầu: {formatVND(wallet.initialAmount)}
                            {wallet.numberOfPeriods && ` · ${wallet.numberOfPeriods} kỳ`}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}