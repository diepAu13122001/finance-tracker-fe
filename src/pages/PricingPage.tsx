import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlanCard } from '@/components/pricing/PlanCard'
import { FeatureRow } from '@/components/pricing/FeatureRow'
import { DS } from '@/lib/design-system'
import { usePlan } from '@/hooks/usePlan'
import { PLAN_CONFIG } from '@/types/plans'
import { ChevronLeft } from 'lucide-react'
import { paymentService } from '@/services/paymentService'
import { notify } from '@/lib/toast'
import { useState } from 'react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLAN_CARDS = [
    {
        planId: 'FREE' as const,
        name: 'Miễn phí',
        price: 0,
        description: 'Theo dõi chi tiêu cơ bản',
        features: [
            'Tối đa 50 giao dịch/tháng',
            'Xem lịch sử giao dịch',
            'Thống kê cơ bản',
            'Xuất dữ liệu (giới hạn)',
        ],
    },
    {
        planId: 'PLUS' as const,
        name: 'Plus',
        price: PLAN_CONFIG.PLUS.priceVnd,
        description: 'Đầy đủ tính năng cho cá nhân',
        isPopular: true,
        features: [
            'Giao dịch không giới hạn',
            'Danh mục chi tiêu',
            'Mục tiêu tài chính',
            'AI Assistant (20 tin/tháng)',
            'Xuất CSV không giới hạn',
            'Dark mode & tuỳ chỉnh màu',
        ],
    },
    {
        planId: 'PREMIUM' as const,
        name: 'Premium',
        price: PLAN_CONFIG.PREMIUM.priceVnd,
        description: 'Cho gia đình và nhu cầu nâng cao',
        features: [
            'Tất cả tính năng Plus',
            'AI không giới hạn + phân loại tự động',
            'Theo dõi đồ dùng gia đình',
            'Thông báo hết hạn sản phẩm',
            'Đánh giá sản phẩm',
            'Báo cáo phân tích nâng cao',
        ],
    },
]

const FEATURE_ROWS = [
    { label: 'Giao dịch/tháng', free: '50', plus: 'Không giới hạn', premium: 'Không giới hạn', highlight: true },
    { label: 'Danh mục chi tiêu', free: false, plus: true, premium: true },
    { label: 'Mục tiêu tài chính', free: false, plus: true, premium: true },
    { label: 'Ngân sách', free: true, plus: true, premium: true },
    { label: 'Xuất CSV', free: false, plus: true, premium: true },
    { label: 'Dark mode', free: false, plus: true, premium: true },
    { label: 'AI tin nhắn/tháng', free: 0, plus: '20 tin', premium: 'Không giới hạn', highlight: true },
    { label: 'AI phân loại tự động', free: false, plus: false, premium: true },
    { label: 'Theo dõi đồ dùng', free: false, plus: false, premium: true },
    { label: 'Thông báo hết hạn', free: false, plus: false, premium: true },
    { label: 'Đánh giá sản phẩm', free: false, plus: false, premium: true },
]

// ─── Component ────────────────────────────────────────────────────────────────

const PricingPage = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { plan } = usePlan()
    const [upgrading, setUpgrading] = useState<'PLUS' | 'PREMIUM' | null>(null)

    // /pricing?required=PREMIUM — hiện banner khi bị redirect từ PlanGate
    const requiredPlan = searchParams.get('required')

    // Tuần 4: thay bằng PayOS payment flow
    const handleUpgrade = async (planId: 'PLUS' | 'PREMIUM') => {

        try {
            const { checkoutUrl } = await paymentService.createPaymentLink(planId)
            // Redirect cứng — PayOS host trang thanh toán ngoài app
            window.location.href = checkoutUrl
        } catch (err) {
            notify.error('Không tạo được link thanh toán, vui lòng thử lại')
            setUpgrading(null)
        }

    }

    return (
        <div className="min-h-screen bg-surface-muted">
            <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-12">

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ChevronLeft size={18} />
                        Quay lại
                    </button>
                </div>
                <div className="text-center flex flex-col gap-3">
                    <h1 className={`${DS.heading1} text-3xl`}>Chọn gói phù hợp với bạn</h1>
                    <p className={DS.muted}>
                        Bắt đầu miễn phí, nâng cấp khi bạn cần thêm tính năng
                    </p>
                </div>



                {/* Banner khi bị redirect từ PlanGate */}
                {requiredPlan && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-center">
                        <p className="text-sm text-amber-700 font-medium">
                            🔒 Tính năng bạn muốn dùng yêu cầu gói{' '}
                            <strong>{requiredPlan === 'PREMIUM' ? '💎 Premium' : '⭐ Plus'}</strong>
                        </p>
                    </div>
                )}

                {/* Plan cards — 3 cột */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLAN_CARDS.map((card) => (
                        <PlanCard
                            key={card.planId}
                            {...card}
                            isCurrentPlan={plan === card.planId}
                            onUpgrade={() => {
                                if (upgrading) return  // ← thêm guard này
                                if (card.planId !== 'FREE') handleUpgrade(card.planId)
                            }}
                        />
                    ))}
                </div>

                {/* Bảng so sánh chi tiết */}
                <div className={`${DS.card} flex flex-col gap-1`}>
                    <h2 className={`${DS.heading2} mb-4`}>So sánh chi tiết</h2>

                    {/* Header bảng */}
                    <div className="grid grid-cols-4 gap-2 px-4 py-2 mb-2">
                        <span className={DS.label}>Tính năng</span>
                        <span className={`${DS.label} text-center`}>Miễn phí</span>
                        <span className={`${DS.label} text-center text-primary-600`}>Plus</span>
                        <span className={`${DS.label} text-center text-amber-600`}>Premium</span>
                    </div>

                    {/* Các hàng tính năng */}
                    {FEATURE_ROWS.map((row, index) => (
                        <FeatureRow key={index} {...row} />
                    ))}
                </div>

                {/* FAQ ngắn */}
                <div className="flex flex-col gap-4">
                    <h2 className={DS.heading2}>Câu hỏi thường gặp</h2>

                    {[
                        {
                            q: 'Gói Plus có thật sự miễn phí không?',
                            a: 'Có — trong giai đoạn beta, gói Plus hoàn toàn miễn phí. Chúng tôi sẽ thông báo trước ít nhất 30 ngày nếu có thay đổi.',
                        },
                        {
                            q: 'Tôi có thể huỷ gói Premium bất cứ lúc nào không?',
                            a: 'Có. Nếu huỷ, bạn vẫn dùng được Premium đến hết chu kỳ thanh toán đã trả.',
                        },
                        {
                            q: 'Dữ liệu của tôi có bị mất khi hạ cấp không?',
                            a: 'Không. Dữ liệu luôn được giữ nguyên — chỉ các tính năng cao cấp sẽ bị khoá.',
                        },
                    ].map((item, index) => (
                        <div key={index} className={DS.card}>
                            <p className={`${DS.heading3} mb-1`}>{item.q}</p>
                            <p className={DS.muted}>{item.a}</p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}

export default PricingPage