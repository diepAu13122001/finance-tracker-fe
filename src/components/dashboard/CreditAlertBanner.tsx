import { AlertTriangle, X, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveWallets } from '@/hooks/useWallets'
import { formatVND } from '@/utils/format'
import { usePlan } from '@/hooks/usePlan'

const WARN_THRESHOLD = 50   // vàng
const DANGER_THRESHOLD = 80 // đỏ

export const CreditAlertBanner = () => {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())
    const navigate = useNavigate()
    const { isPlus } = usePlan()
    const { data: wallets } = useActiveWallets(isPlus)

    const alertCards = (wallets ?? [])
        .filter(w =>
            w.type === 'DEBT'
            && w.subtype === 'CREDIT_CARD'
            && w.creditLimit
            && w.progressPercent >= WARN_THRESHOLD
            && !dismissed.has(w.id)
        )
        .sort((a, b) => b.progressPercent - a.progressPercent)
        .slice(0, 3)

    if (alertCards.length === 0) return null

    return (
        <div className="flex flex-col gap-2">
            {alertCards.map(card => {
                const isDanger = card.progressPercent >= DANGER_THRESHOLD
                return (
                    <div
                        key={card.id}
                        className={`
                            flex items-start gap-3 px-4 py-3 rounded-xl border
                            animate-in fade-in slide-in-from-top-2 duration-300
                            ${isDanger ? 'bg-danger-50 border-danger-200' : 'bg-amber-50 border-amber-200'}
                        `}
                    >
                        <AlertTriangle
                            size={16}
                            className={`flex-shrink-0 mt-0.5 ${isDanger ? 'text-danger-600' : 'text-amber-600'}`}
                        />
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${isDanger ? 'text-danger-600' : 'text-amber-700'}`}>
                                {isDanger ? '🚨' : '⚠️'} {card.name}
                                {' '}—{' '}
                                <span className="font-bold">{card.progressPercent.toFixed(0)}%</span> hạn mức
                            </p>
                            <p className={`text-xs mt-0.5 ${isDanger ? 'text-danger-600' : 'text-amber-600'}`}>
                                Đã dùng {formatVND(card.currentAmount)} / {formatVND(card.creditLimit!)}
                                {card.billingDate && ` · Đáo hạn ngày ${card.billingDate}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={() => navigate('/wallets')}
                                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors
                                    ${isDanger ? 'text-danger-600 hover:bg-danger-100' : 'text-amber-600 hover:bg-amber-100'}`}
                            >
                                Chi tiết <ArrowRight size={12} />
                            </button>
                            <button
                                onClick={() => setDismissed(prev => new Set(prev).add(card.id))}
                                className="p-1 rounded-md text-text-muted hover:bg-surface-border transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}