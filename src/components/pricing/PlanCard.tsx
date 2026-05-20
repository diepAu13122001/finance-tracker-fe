import { DS } from '@/lib/design-system'
import { Check } from 'lucide-react'
import { LockedBadge } from '@/components/shared/LockedBadge'
import type { PlanId } from '@/types/plans'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanCardProps {
    planId: PlanId
    name: string
    price: number       // giá VND/năm, 0 = miễn phí
    description: string
    features: string[]     // danh sách tính năng nổi bật
    isCurrentPlan: boolean
    isPopular?: boolean
    onUpgrade: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PlanCard = ({
    planId,
    name,
    price,
    description,
    features,
    isCurrentPlan,
    isPopular = false,
    onUpgrade,
}: PlanCardProps) => {
    const isPremium = planId === 'PREMIUM'

    return (
        <div className={`
      relative flex flex-col rounded-2xl border p-6 gap-5
      ${isPopular
                ? 'border-primary-500 shadow-lg shadow-primary-100 bg-white'
                : 'border-surface-border bg-white'
            }
    `}>

            {/* Badge "Phổ biến" */}
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`${DS.badge} bg-primary-500 text-white px-3`}>
                        Phổ biến nhất
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <h3 className={DS.heading2}>{name}</h3>
                    {planId !== 'FREE' && (
                        <LockedBadge requiredPlan={planId as Exclude<PlanId, 'FREE'>} />
                    )}
                </div>
                <p className={DS.muted}>{description}</p>
            </div>

            {/* Giá */}
            <div className="flex items-baseline gap-1">
                {price === 0 ? (
                    <span className="text-3xl font-bold text-text-primary">Miễn phí</span>
                ) : (
                    <>
                        <span className={`text-3xl font-bold ${isPremium ? 'text-amber-600' : 'text-primary-600'}`}>
                            {price.toLocaleString('vi-VN')}₫
                        </span>
                        <span className={DS.muted}>/tháng</span>
                    </>
                )}
            </div>

            {/* Tính năng nổi bật */}
            <ul className="flex flex-col gap-2 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <Check
                            size={16}
                            className={`shrink-0 mt-0.5 ${isPremium ? 'text-amber-500' : 'text-success-500'}`}
                        />
                        <span className={DS.body}>{feature}</span>
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            {isCurrentPlan ? (
                <div className="text-center py-2 rounded-lg bg-surface-muted">
                    <span className={`${DS.label} text-text-muted`}>✓ Gói hiện tại của bạn</span>
                </div>
            ) : (
                <button
                    onClick={onUpgrade}
                    className={isPremium ? DS.btnPremium : DS.btnPrimary}
                >
                    {price === 0 ? 'Bắt đầu miễn phí' : `Nâng cấp lên ${name}`}
                </button>
            )}

        </div>
    )
}