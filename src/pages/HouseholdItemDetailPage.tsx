import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, Pencil, CheckCircle, RefreshCw, Trash2 } from 'lucide-react'
import { DS } from '@/lib/design-system'
import { Button } from '@/components/shared/Button'
import { animations } from '@/lib/animations'
import { useHouseholdItem, useUpdateItemStatus, useDeleteHouseholdItem } from '@/hooks/useHousehold'
import { AddItemModal } from '@/components/household/AddItemModal'
import { ReviewModal } from '@/components/household/ReviewModal'
import { formatVND } from '@/utils/format'
import { Skeleton } from '@/components/shared/Skeleton'
import { ITEM_CATEGORY_CONFIG, ITEM_STATUS_CONFIG } from '@/types/household'
import type { ItemStatus } from '@/types/household'

const HouseholdItemDetailPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [editOpen, setEditOpen] = useState(false)
    const [reviewOpen, setReviewOpen] = useState(false)
    const [confirmDel, setConfirmDel] = useState(false)

    const { data: item, isLoading } = useHouseholdItem(id ?? '', !!id)
    const updateStatus = useUpdateItemStatus()
    const deleteMutation = useDeleteHouseholdItem()

    const handleStatusChange = async (newStatus: ItemStatus) => {
        if (!item) return
        await updateStatus.mutateAsync({ id: item.id, status: newStatus })
        if (newStatus === 'FINISHED') setReviewOpen(true)
    }

    const handleDelete = async () => {
        if (!item) return
        if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3000); return }
        await deleteMutation.mutateAsync(item.id)
        navigate('/household')
    }

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto p-6 flex flex-col gap-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
            </div>
        )
    }

    if (!item) return (
        <div className="max-w-2xl mx-auto p-6 text-center py-20">
            <p className={DS.heading3}>Không tìm thấy sản phẩm</p>
            <button onClick={() => navigate('/household')} className="mt-4 text-primary-600 hover:underline">
                ← Quay lại
            </button>
        </div>
    )

    const catConfig = ITEM_CATEGORY_CONFIG[item.category]
    const statusConfig = ITEM_STATUS_CONFIG[item.status]

    return (
        <div className={`max-w-2xl mx-auto p-6 flex flex-col gap-5 ${animations.fadeIn}`}>

            {/* Back button */}
            <button
                onClick={() => navigate('/household')}
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary-600 transition-colors w-fit"
            >
                <ChevronLeft size={18} /> Đồ dùng gia đình
            </button>

            {/* Hero card */}
            <div className={DS.card}>
                <div className="flex items-start gap-4">
                    {/* Category emoji — large */}
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 bg-surface-muted">
                        {catConfig.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className={`${DS.heading1} leading-tight`}>{item.name}</h1>
                        {item.brand && (
                            <p className="text-sm text-text-muted mt-0.5">{item.brand}</p>
                        )}

                        {/* Status + expiry badges */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span
                                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                style={{ backgroundColor: statusConfig.color + '18', color: statusConfig.color }}
                            >
                                {statusConfig.label}
                            </span>

                            {item.expired && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-danger-100 text-danger-700 font-bold">
                                    ⚠ Đã quá hạn
                                </span>
                            )}
                            {item.expiringSoon && !item.expired && item.daysUntilExpiry !== null && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">
                                    ⏰ Còn {item.daysUntilExpiry} ngày
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Edit */}
                    <button onClick={() => setEditOpen(true)}
                        className="p-2 rounded-lg hover:bg-surface-muted text-text-muted">
                        <Pencil size={16} />
                    </button>
                </div>
            </div>

            {/* Info grid */}
            <div className={`${DS.card} grid grid-cols-2 gap-4`}>
                {[
                    { label: 'Danh mục', value: catConfig.label },
                    { label: 'Giá mua', value: item.price ? formatVND(item.price) : '—' },
                    { label: 'Số lượng', value: item.quantity ? `${item.quantity} ${item.unit ?? ''}`.trim() : '—' },
                    { label: 'Ngày mua', value: item.purchaseDate ?? '—' },
                    {
                        label: 'Hạn sử dụng',
                        value: item.expiryDate
                            ? `${item.expiryDate} ${item.daysUntilExpiry !== null
                                ? `(${item.daysUntilExpiry >= 0 ? 'còn ' + item.daysUntilExpiry : 'quá ' + Math.abs(item.daysUntilExpiry)} ngày)`
                                : ''}`
                            : '—',
                    },
                    { label: 'Nhắc trước', value: `${item.notifyBeforeDays} ngày` },
                ].map(row => (
                    <div key={row.label}>
                        <p className="text-xs text-text-muted">{row.label}</p>
                        <p className="text-sm font-semibold text-text-primary mt-0.5">{row.value}</p>
                    </div>
                ))}

                {item.notes && (
                    <div className="col-span-2 border-t border-surface-border pt-3 mt-1">
                        <p className="text-xs text-text-muted">Ghi chú</p>
                        <p className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap">{item.notes}</p>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className={DS.card}>
                <h3 className={`${DS.heading3} mb-3`}>Cập nhật trạng thái</h3>
                <div className="grid grid-cols-2 gap-2">
                    {item.status !== 'IN_USE' && (
                        <Button variant="ghost" onClick={() => handleStatusChange('IN_USE')}
                            className="!justify-start gap-2">
                            ↩ Đang dùng lại
                        </Button>
                    )}
                    {item.status === 'IN_USE' && (
                        <>
                            <Button variant="ghost" onClick={() => handleStatusChange('FINISHED')}
                                className="!justify-start gap-2">
                                <CheckCircle size={15} /> Đã hết — Đánh giá
                            </Button>
                            <Button variant="ghost" onClick={() => handleStatusChange('NEED_RESTOCK')}
                                className="!justify-start gap-2">
                                <RefreshCw size={15} /> Cần mua thêm
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Review CTA */}
            <button
                onClick={() => setReviewOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-amber-700 text-sm font-medium"
            >
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                Đánh giá sản phẩm này
            </button>

            {/* Delete */}
            <div className={`${DS.card} border-danger-200`}>
                <p className={`${DS.muted} mb-3`}>Vùng nguy hiểm</p>
                <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${confirmDel
                            ? 'bg-danger-500 text-white scale-105'
                            : 'border border-danger-200 text-danger-600 hover:bg-danger-50'
                        }`}
                >
                    <Trash2 size={14} />
                    {confirmDel ? 'Bấm lần nữa để xác nhận xóa' : 'Xóa sản phẩm'}
                </button>
            </div>

        </div>
    )
}

export default HouseholdItemDetailPage