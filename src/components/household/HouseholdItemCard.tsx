import { useState } from 'react'
import { Pencil, Trash2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { DS } from '@/lib/design-system'
import { formatVND } from '@/utils/format'
import { useUpdateItemStatus, useDeleteHouseholdItem } from '@/hooks/useHousehold'
import { ITEM_CATEGORY_CONFIG, ITEM_STATUS_CONFIG } from '@/types/household'
import type { HouseholdItemResponse, ItemStatus } from '@/types/household'
import { useNavigate } from 'react-router-dom'

interface HouseholdItemCardProps {
    item: HouseholdItemResponse
    onEdit: () => void
    onReview?: () => void   // gọi sau khi FINISHED
    onClick?: () => void
}

export const HouseholdItemCard = ({ item, onEdit, onReview, onClick }: HouseholdItemCardProps) => {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const updateStatus = useUpdateItemStatus()
    const deleteMutation = useDeleteHouseholdItem()
    const navigate = useNavigate()

    const catConfig = ITEM_CATEGORY_CONFIG[item.category]
    const statusConfig = ITEM_STATUS_CONFIG[item.status]

    const handleStatusChange = async (newStatus: ItemStatus) => {
        await updateStatus.mutateAsync({ id: item.id, status: newStatus })
        // Nếu vừa đổi sang FINISHED → nhắc review
        if (newStatus === 'FINISHED' && onReview) onReview()
    }

    return (
        <div
            className={`
                ${DS.card} flex flex-col gap-3 cursor-pointer
                hover:border-primary-200 hover:shadow-md transition-all
                ${item.expired ? 'border-danger-300 bg-danger-50/20' : ''}
                ${item.expiringSoon && !item.expired ? 'border-amber-300 bg-amber-50/20' : ''}
            `}
            onClick={() => navigate(`/household/${item.id}`)}
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{catConfig.emoji}</span>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-text-primary truncate">{item.name}</div>
                    {item.brand && (
                        <div className="text-xs text-text-muted">{item.brand}</div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={onEdit}
                        className="p-1.5 rounded-md hover:bg-surface-muted text-text-muted">
                        <Pencil size={13} />
                    </button>
                    <button
                        onClick={() => {
                            if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return }
                            deleteMutation.mutate(item.id)
                        }}
                        className={`p-1.5 rounded-md transition-all ${confirmDelete ? 'bg-danger-500 text-white scale-110' : 'text-text-muted hover:text-danger-500'}`}
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Status badge + expiry */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusConfig.bg}`}
                    style={{ color: statusConfig.color }}>
                    {statusConfig.label}
                </span>
                {item.expired && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-danger-100 text-danger-700 font-bold flex items-center gap-1">
                        <AlertTriangle size={10} /> Đã hết hạn
                    </span>
                )}
                {item.expiringSoon && !item.expired && item.daysUntilExpiry !== null && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                        ⏰ Còn {item.daysUntilExpiry} ngày
                    </span>
                )}
                {item.price && (
                    <span className="text-xs text-text-muted">{formatVND(item.price)}</span>
                )}
            </div>

            {/* Quick action buttons */}
            {item.status === 'IN_USE' && (
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => handleStatusChange('FINISHED')}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg bg-surface-muted text-text-secondary hover:bg-success-50 hover:text-success-600 transition-colors"
                    >
                        <CheckCircle size={12} /> Đã hết
                    </button>
                    <button
                        onClick={() => handleStatusChange('NEED_RESTOCK')}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg bg-surface-muted text-text-secondary hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    >
                        <RefreshCw size={12} /> Cần mua
                    </button>
                </div>
            )}
            {item.status !== 'IN_USE' && (
                <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange('IN_USE') }}
                    className="text-xs py-1.5 rounded-lg bg-surface-muted text-text-muted hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                    ↩ Dùng lại
                </button>
            )}
        </div>
    )
}