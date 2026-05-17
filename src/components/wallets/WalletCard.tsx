import { useState } from 'react'
import { Pencil, Trash2, Ban, AlertTriangle, ChevronRight, RotateCcw } from 'lucide-react'
import * as Icons from 'lucide-react'
import { DS } from '@/lib/design-system'
import { useCancelWallet, useDeleteWallet, useReopenWallet, useWalletCount } from '@/hooks/useWallets'
import { WALLET_TYPE_CONFIG } from '@/types/wallet'
import type { WalletResponse } from '@/types/wallet'
import { formatVND } from '@/utils/format'
import { usePlan } from '@/hooks/usePlan'

const toPascalCase = (s: string) =>
    s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

interface WalletCardProps {
    wallet: WalletResponse
    onEdit: () => void
    onClick?: () => void
}

export const WalletCard = ({ wallet, onEdit, onClick }: WalletCardProps) => {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const cancelMutation = useCancelWallet()
    const deleteMutation = useDeleteWallet()
    const reopenMutation = useReopenWallet()
    const { isFree } = usePlan()
    const { data: walletCount } = useWalletCount()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (Icons as any)[toPascalCase(wallet.icon)] || Icons.Wallet
    const config = WALLET_TYPE_CONFIG[wallet.type]
    const isDebtDanger = wallet.type === 'DEBT' && wallet.overLimit
    const isCancelled = wallet.status === 'CANCELLED'
    const isInstallment = wallet.type === 'DEBT' && wallet.subtype === 'INSTALLMENT'

    // Số kỳ đã trả: floor(đã trả / mỗi kỳ)
    const periodsCompleted = (() => {
        if (!isInstallment || !wallet.monthlyPayment || wallet.monthlyPayment === 0) return 0
        const amountPaid = wallet.initialAmount
            ? Math.max(0, (wallet.initialAmount) - wallet.currentAmount)
            : 0
        return Math.floor(amountPaid / wallet.monthlyPayment)
    })()

    // Ví trả góp đã hoàn thành: currentAmount = 0 (đã trả hết nợ)
    const isInstallmentCompleted = isInstallment && wallet.currentAmount <= 0

    // Free user có thể reopen không?
    const canReopen = !isFree || (walletCount && walletCount.total < walletCount.limit)

    const handleCardClick = () => {
        if (onClick) onClick()
    }

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation()
        const msg = isInstallmentCompleted
            ? `Đóng ví trả góp "${wallet.name}"?\n\nVí trả góp đã hoàn thành sẽ được đóng lại và giải phóng 1 slot ví.`
            : `Đóng "${wallet.name}"?\n\nVí đã đóng vẫn giữ lịch sử giao dịch. Slot ví sẽ được giải phóng (có thể tạo ví mới).`
        if (window.confirm(msg)) {
            cancelMutation.mutate(wallet.id)
        }
    }

    const handleReopen = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!canReopen) {
            window.alert('Đã đạt giới hạn 5 ví đang hoạt động. Đóng 1 ví khác trước hoặc nâng cấp Plus.')
            return
        }
        reopenMutation.mutate(wallet.id)
    }

    return (
        <div
            className={`
                ${DS.card} flex flex-col gap-3
                transition-all hover:shadow-md
                ${onClick ? 'cursor-pointer hover:border-primary-200' : ''}
                ${isDebtDanger ? 'border-danger-300 bg-danger-50/30' : ''}
                ${isCancelled ? 'opacity-70 bg-surface-muted' : ''}
                ${isInstallmentCompleted && !isCancelled ? 'border-success-300 bg-success-50/20' : ''}
            `}
            onClick={handleCardClick}
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                        backgroundColor: isDebtDanger ? '#fef2f2'
                            : isInstallmentCompleted ? '#f0fdf4'
                                : wallet.color + '20',
                        color: isDebtDanger ? '#ef4444'
                            : isInstallmentCompleted ? '#22c55e'
                                : wallet.color,
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
                        {isInstallmentCompleted && !isCancelled && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-success-100 text-success-700">
                                ✓ Đã trả hết
                            </span>
                        )}
                        {isDebtDanger && !isInstallment && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-danger-100 text-danger-700 flex items-center gap-1">
                                <AlertTriangle size={10} /> Vượt hạn mức!
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {isCancelled ? (
                        // Ví đã đóng: nút mở lại
                        <button
                            onClick={handleReopen}
                            disabled={reopenMutation.isPending}
                            title={canReopen ? 'Mở lại ví' : 'Đã đạt giới hạn ví'}
                            className={`p-1.5 rounded-md transition-colors ${canReopen
                                    ? 'text-text-muted hover:bg-success-50 hover:text-success-600'
                                    : 'text-text-muted opacity-40 cursor-not-allowed'
                                }`}
                        >
                            <RotateCcw size={13} />
                        </button>
                    ) : (
                        <>
                            {/* Ví active: edit + close (trừ khi installment đã hoàn thành) */}
                            {!isInstallmentCompleted && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit() }}
                                    className="p-1.5 rounded-md text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors"
                                    title="Sửa"
                                >
                                    <Pencil size={13} />
                                </button>
                            )}
                            <button
                                onClick={handleClose}
                                disabled={cancelMutation.isPending}
                                className="p-1.5 rounded-md text-text-muted hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                title={isInstallmentCompleted ? 'Đóng ví (đã trả hết)' : 'Đóng ví'}
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
                        className={`p-1.5 rounded-md transition-all ${confirmDelete
                                ? 'bg-danger-500 text-white scale-110'
                                : 'text-text-muted hover:text-danger-500'
                            }`}
                    >
                        <Trash2 size={13} />
                    </button>

                    {onClick && !isCancelled && (
                        <ChevronRight size={14} className="text-text-muted ml-1" />
                    )}
                </div>
            </div>

            {/* Body — NORMAL wallet */}
            {wallet.type === 'NORMAL' && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Số dư hiện tại</span>
                    <span className={`text-base font-bold ${wallet.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {wallet.balance < 0 ? '−' : ''}{formatVND(Math.abs(wallet.balance))}
                    </span>
                </div>
            )}

            {/* Body — DEBT CREDIT_CARD */}
            {wallet.type === 'DEBT' && !isInstallment && !isCancelled && (
                <>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">
                            Đã dùng: {formatVND(wallet.currentAmount)}
                            {wallet.creditLimit ? ` / ${formatVND(wallet.creditLimit)}` : ''}
                        </span>
                        <span
                            className={`font-bold ${isDebtDanger ? 'text-danger-600' : ''}`}
                            style={!isDebtDanger ? { color: wallet.color } : undefined}
                        >
                            {wallet.progressPercent.toFixed(0)}%
                        </span>
                    </div>
                    {wallet.creditLimit && (
                        <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(wallet.progressPercent, 100)}%`,
                                    backgroundColor: isDebtDanger ? '#ef4444' : wallet.color,
                                }}
                            />
                        </div>
                    )}
                    {wallet.billingDate && (
                        <div className="text-xs text-text-muted">
                            Đáo hạn ngày {wallet.billingDate} hàng tháng
                        </div>
                    )}
                </>
            )}

            {/* Body — DEBT INSTALLMENT */}
            {isInstallment && !isCancelled && (
                <>
                    {/* Hiển thị số KỲ đã trả, không phải số tiền */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Kỳ đã trả</span>
                        <span className={`text-sm font-bold ${isInstallmentCompleted ? 'text-success-600' : 'text-text-primary'}`}>
                            {periodsCompleted}
                            {wallet.numberOfPeriods ? ` / ${wallet.numberOfPeriods} kỳ` : ' kỳ'}
                        </span>
                    </div>

                    {/* Progress bar kỳ trả */}
                    {wallet.numberOfPeriods && wallet.numberOfPeriods > 0 && (
                        <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min((periodsCompleted / wallet.numberOfPeriods) * 100, 100)}%`,
                                    backgroundColor: isInstallmentCompleted ? '#22c55e' : wallet.color,
                                }}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-surface-muted rounded-lg px-2 py-1.5">
                            <div className="text-text-muted">Mỗi kỳ</div>
                            <div className="font-bold text-danger-600">
                                {wallet.monthlyPayment ? formatVND(wallet.monthlyPayment) : '—'}
                            </div>
                        </div>
                        <div className="bg-surface-muted rounded-lg px-2 py-1.5">
                            <div className="text-text-muted">Còn lại</div>
                            <div className={`font-bold ${isInstallmentCompleted ? 'text-success-600' : 'text-danger-600'}`}>
                                {isInstallmentCompleted ? 'Đã trả hết!' : formatVND(wallet.currentAmount)}
                            </div>
                        </div>
                    </div>

                    {wallet.initialAmount && (
                        <div className="text-xs text-text-muted">
                            Khoản vay: {formatVND(wallet.initialAmount)}
                            {wallet.numberOfPeriods && ` · ${wallet.numberOfPeriods} kỳ`}
                        </div>
                    )}

                    {isInstallmentCompleted && (
                        <div className="flex items-center gap-2 bg-success-50 rounded-lg px-3 py-2">
                            <span className="text-success-600 text-sm font-medium">
                                🎉 Đã trả hết! Đóng ví để giải phóng slot.
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}