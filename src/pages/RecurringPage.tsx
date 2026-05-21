import { useState } from 'react'
import { DS } from '@/lib/design-system'
import { useRecurring } from '@/hooks/useRecurring'
import { RecurringCard } from '@/components/recurring/RecurringCard'
import { RecurringFormModal } from '@/components/recurring/RecurringFormModal'
import { UpgradePrompt } from '@/components/shared'
import { usePlan } from '@/hooks/usePlan'
import { RecurringTransaction } from '@/types/recurring'

/**
 * Trang quản lý giao dịch định kỳ.
 *
 * Plan gating: chỉ Plus trở lên mới có recurringService →
 *   tránh gọi API rồi nhận 403 → dùng usePlan + UpgradePrompt thay thế.
 */
const RecurringPage = () => {
    const { isPlus } = usePlan()
    const { data: items = [], isLoading } = useRecurring()
    const [showForm, setShowForm] = useState(false)
    const [editTarget, setEditTarget] = useState<RecurringTransaction | null>(null)

    if (!isPlus) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <h1 className={DS.heading1}>Giao dịch định kỳ</h1>
                <p className={DS.muted}>Tự động nhắc nhở và ghi các khoản lặp lại</p>
                <div className="mt-6">
                    <UpgradePrompt requiredPlan="PLUS" layout="card" />
                </div>
            </div>
        )
    }

    const openCreate = () => { setEditTarget(null); setShowForm(true) }
    const openEdit = (r: RecurringTransaction) => { setEditTarget(r); setShowForm(true) }
    const closeForm = () => { setShowForm(false); setEditTarget(null) }

    const active   = items.filter(r => r.isActive)
    const inactive = items.filter(r => !r.isActive)

    return (
        <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className={DS.heading1}>Giao dịch định kỳ</h1>
                    <p className={DS.muted}>Tự động ghi các khoản lặp lại hàng ngày / tuần / tháng / năm</p>
                </div>
                <button onClick={openCreate} className={DS.btnPrimary}>
                    + Thêm
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-surface-muted rounded-xl animate-pulse" />
                    ))}
                </div>
            )}

            {/* Active */}
            {!isLoading && active.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h2 className={DS.heading2}>Ang hoạt động ({active.length})</h2>
                    {active.map(r => (
                        <RecurringCard key={r.id} recurring={r} onEdit={openEdit} />
                    ))}
                </div>
            )}

            {/* Inactive */}
            {!isLoading && inactive.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h2 className={`${DS.heading2} text-text-muted`}>Đã tắt ({inactive.length})</h2>
                    {inactive.map(r => (
                        <RecurringCard key={r.id} recurring={r} onEdit={openEdit} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && items.length === 0 && (
                <div className="text-center py-16 flex flex-col items-center gap-3">
                    <p className="text-4xl">🔄</p>
                    <p className={DS.muted}>Chưa có giao dịch định kỳ nào.</p>
                    <button onClick={openCreate} className={DS.btnPrimary}>
                        Tạo giao dịch định kỳ đầu tiên
                    </button>
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <RecurringFormModal editTarget={editTarget} onClose={closeForm} />
            )}
        </div>
    )
}

export default RecurringPage
