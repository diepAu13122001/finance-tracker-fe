import { useState } from 'react'
import { ChevronDown, Wallet, Plus } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useActiveWallets } from '@/hooks/useWallets'
import { DS } from '@/lib/design-system'
import { WALLET_TYPE_CONFIG } from '@/types/wallet'
import { formatVND } from '@/utils/format'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '@/hooks/usePlan'

const toPascalCase = (s: string) =>
    s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

interface WalletSelectorProps {
    value: string | null
    onChange: (walletId: string | null) => void
    required?: boolean
    label?: string
    error?: string
    /** Loại trừ ví này khỏi danh sách (dùng cho transfer: ví đích không được trùng ví nguồn) */
    excludeWalletId?: string
}

export const WalletSelector = ({
    value,
    onChange,
    required = false,
    label = 'Nguồn tiền',
    error,
    excludeWalletId,
}: WalletSelectorProps) => {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()
    const { isPlus } = usePlan()
    const { data: allWallets, isLoading } = useActiveWallets(true) // luôn fetch
    const wallets = allWallets?.filter(w => w.id !== excludeWalletId) ?? []
    const selected = wallets?.find(w => w.id === value) ?? null

    return (
        <div className="relative">
            <label className={`${DS.label} ${required ? "after:content-['*'] after:text-danger-500 after:ml-0.5" : ''}`}>
                {label}
            </label>

            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`${DS.inputBase} flex items-center justify-between cursor-pointer mt-1 ${error ? 'border-danger-500' : ''}`}
            >
                {selected ? (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: selected.color + '25', color: selected.color }}>
                            {(() => { const I = (Icons as any)[toPascalCase(selected.icon)] || Wallet; return <I size={14} /> })()}
                        </div>
                        <span className="text-sm font-medium">{selected.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${WALLET_TYPE_CONFIG[selected.type].bgClass} ${WALLET_TYPE_CONFIG[selected.type].textClass}`}>
                            {WALLET_TYPE_CONFIG[selected.type].label}
                        </span>
                        {selected.type === 'NORMAL' && (
                            <span className="text-xs text-text-muted">{formatVND(selected.balance)}</span>
                        )}
                    </div>
                ) : (
                    <span className="text-text-muted text-sm">
                        {required ? 'Chọn nguồn tiền *' : 'Chọn nguồn tiền (tùy chọn)'}
                    </span>
                )}
                <ChevronDown size={16} className={`text-text-muted transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
            </button>

            {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}

            {open && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                    <div className="absolute z-40 mt-1 w-full bg-white rounded-xl shadow-xl border border-surface-border max-h-72 overflow-y-auto">

                        {!required && (
                            <button type="button" onClick={() => { onChange(null); setOpen(false) }}
                                className="w-full px-3 py-2.5 text-left text-sm hover:bg-surface-muted">
                                <span className="text-text-muted italic">Không chọn nguồn tiền</span>
                            </button>
                        )}

                        {isLoading && <div className="px-3 py-4 text-sm text-text-muted">Đang tải...</div>}

                        {!isLoading && wallets?.map(wallet => {
                            const IconComp = (Icons as any)[toPascalCase(wallet.icon)] || Wallet
                            const config = WALLET_TYPE_CONFIG[wallet.type]
                            return (
                                <button key={wallet.id} type="button"
                                    onClick={() => { onChange(wallet.id); setOpen(false) }}
                                    className={`w-full px-3 py-3 text-left flex items-center gap-3 hover:bg-surface-muted transition-colors ${value === wallet.id ? 'bg-surface-muted' : ''}`}>
                                    <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: wallet.color + '20', color: wallet.color }}>
                                        <IconComp size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-semibold text-text-primary truncate">{wallet.name}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${config.bgClass} ${config.textClass}`}>
                                                {config.label}
                                            </span>
                                            {wallet.overLimit && <span className="text-xs text-danger-600 font-bold">⚠</span>}
                                        </div>
                                        {wallet.type === 'NORMAL' && (
                                            <div className={`text-xs font-medium mt-0.5 ${wallet.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                                                Số dư: {formatVND(wallet.balance)}
                                            </div>
                                        )}
                                        {wallet.type === 'DEBT' && (
                                            <div className="text-xs text-danger-600 font-medium mt-0.5">
                                                Nợ: {formatVND(wallet.currentAmount)}
                                                {wallet.overLimit && ' ⚠ Vượt hạn mức!'}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            )
                        })}

                        {!isLoading && wallets.length === 0 && (
                            <div className="px-3 py-4 text-center">
                                <Wallet size={24} className="mx-auto text-text-muted mb-2" />
                                <p className="text-sm text-text-muted mb-2">
                                    {excludeWalletId ? 'Không còn ví nào khả dụng' : 'Chưa có nguồn tiền nào'}
                                </p>
                                {!excludeWalletId && (
                                    <button onClick={() => { navigate('/wallets'); setOpen(false) }}
                                        className="text-sm text-primary-600 hover:underline flex items-center gap-1 mx-auto">
                                        <Plus size={14} /> Tạo nguồn tiền đầu tiên
                                    </button>
                                )}
                            </div>
                        )}

                        {!isLoading && wallets.length > 0 && (
                            <button onClick={() => { navigate('/wallets'); setOpen(false) }}
                                className="w-full px-3 py-2.5 text-xs text-primary-600 hover:bg-primary-50 border-t border-surface-border flex items-center gap-1.5">
                                <Plus size={12} /> Quản lý nguồn tiền
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}