import { useState } from 'react'
import { Plus, Star, Package } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { DS } from '@/lib/design-system'
import { PlanGate } from '@/components/shared/PlanGate'
import { HouseholdItemCard } from '@/components/household/HouseholdItemCard'
import { AddItemModal } from '@/components/household/AddItemModal'
import { ReviewModal } from '@/components/household/ReviewModal'
import { animations } from '@/lib/animations'
import { useHouseholdItems, useTopRatedItems } from '@/hooks/useHousehold'
import { Skeleton } from '@/components/shared/Skeleton'
import { ITEM_CATEGORY_CONFIG, ITEM_STATUS_CONFIG } from '@/types/household'
import type { HouseholdItemResponse, ItemCategory, ItemStatus } from '@/types/household'

type HouseholdTab = 'ITEMS' | 'TOP_RATED'

const HouseholdPage = () => {
    const [tab, setTab] = useState<HouseholdTab>('ITEMS')
    const [statusFilter, setStatus] = useState<ItemStatus | undefined>(undefined)
    const [catFilter, setCat] = useState<ItemCategory | undefined>(undefined)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<HouseholdItemResponse | null>(null)
    const [reviewItem, setReviewItem] = useState<HouseholdItemResponse | null>(null)

    const { data, isLoading } = useHouseholdItems(0, 50, statusFilter, catFilter)
    const { data: topRated, isLoading: loadingTop } = useTopRatedItems()

    const items = data?.content ?? []
    const expiringCount = items.filter(i => i.expiringSoon || i.expired).length

    return (
        <PlanGate requires="PREMIUM">
            <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">

                <div className={`flex items-center justify-between ${animations.fadeInUp}`}>
                    <div>
                        <h1 className={DS.heading1}>🏠 Đồ dùng gia đình</h1>
                        <p className={DS.muted}>Theo dõi và đánh giá sản phẩm</p>
                    </div>
                    <Button leftIcon={<Plus size={16} />} onClick={() => { setEditing(null); setModalOpen(true) }}>
                        Thêm mới
                    </Button>
                </div>

                {/* Alert hết hạn */}
                {expiringCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                        <span className="text-amber-600">⏰</span>
                        <p className="text-sm text-amber-700">
                            <strong>{expiringCount} sản phẩm</strong> sắp hết hạn hoặc đã hết hạn.
                        </p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-surface-muted rounded-xl">
                    {[
                        { key: 'ITEMS' as const, label: '📦 Đồ dùng', icon: Package },
                        { key: 'TOP_RATED' as const, label: '⭐ Đánh giá cao', icon: Star },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
                            ${tab === t.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab: ITEMS ── */}
                {tab === 'ITEMS' && (
                    <>
                        {/* Filters */}
                        <div className="flex flex-wrap gap-2">
                            {/* Status filter */}
                            <div className="flex gap-1 p-1 bg-surface-muted rounded-lg text-xs">
                                <button onClick={() => setStatus(undefined)}
                                    className={`px-2 py-1 rounded-md transition-colors
                                    ${!statusFilter ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted'}`}>
                                    Tất cả
                                </button>
                                {(Object.keys(ITEM_STATUS_CONFIG) as ItemStatus[]).map(s => (
                                    <button key={s} onClick={() => setStatus(s === statusFilter ? undefined : s)}
                                        className={`px-2 py-1 rounded-md transition-colors
                                        ${statusFilter === s ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted'}`}>
                                        {ITEM_STATUS_CONFIG[s].label}
                                    </button>
                                ))}
                            </div>

                            {/* Category filter */}
                            <div className="flex gap-1 flex-wrap">
                                {(Object.keys(ITEM_CATEGORY_CONFIG) as ItemCategory[]).map(cat => {
                                    const cfg = ITEM_CATEGORY_CONFIG[cat]
                                    return (
                                        <button key={cat} onClick={() => setCat(cat === catFilter ? undefined : cat)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border
                                            ${catFilter === cat
                                                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                                                    : 'bg-surface border-surface-border text-text-muted'
                                                }`}>
                                            {cfg.emoji} {cfg.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {isLoading && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
                            </div>
                        )}

                        {!isLoading && items.length === 0 && (
                            <div className={`${DS.card} text-center py-12`}>
                                <p className="text-4xl mb-3">📦</p>
                                <p className={DS.heading3}>Chưa có đồ dùng nào</p>
                                <p className={`${DS.muted} mt-2 mb-4`}>
                                    Thêm sản phẩm để theo dõi hạn sử dụng
                                </p>
                                <Button leftIcon={<Plus size={16} />}
                                    onClick={() => setModalOpen(true)}>
                                    Thêm đồ dùng đầu tiên
                                </Button>
                            </div>
                        )}

                        {!isLoading && items.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {items.map(item => (
                                    <HouseholdItemCard
                                        key={item.id}
                                        item={item}
                                        onEdit={() => { setEditing(item); setModalOpen(true) }}
                                        onReview={() => setReviewItem(item)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── Tab: TOP RATED ── */}
                {tab === 'TOP_RATED' && (
                    <div className="flex flex-col gap-3">
                        {loadingTop && <Skeleton className="h-64 rounded-xl" />}
                        {!loadingTop && (!topRated || topRated.length === 0) && (
                            <div className={`${DS.card} text-center py-10`}>
                                <p className="text-3xl mb-2">⭐</p>
                                <p className={DS.heading3}>Chưa có đánh giá nào</p>
                                <p className={`${DS.muted} mt-1`}>
                                    Dùng xong sản phẩm → đánh giá → xem top ở đây
                                </p>
                            </div>
                        )}
                        {!loadingTop && topRated && topRated.map((item, i) => (
                            <div key={String(item.itemId)} className={`${DS.card} flex items-center gap-3`}>
                                <span className="text-lg font-bold text-text-muted w-6">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-text-primary truncate">{item.name}</div>
                                    {item.brand && <div className="text-xs text-text-muted">{item.brand}</div>}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                    <span className="font-bold text-amber-600">{Number(item.avgRating).toFixed(1)}</span>
                                    <span className="text-xs text-text-muted">({item.reviewCount})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* FAB mobile */}
                <button onClick={() => { setEditing(null); setModalOpen(true) }}
                    className="fixed bottom-20 right-4 z-40 md:hidden w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg hover:bg-primary-600 active:scale-95 transition-all">
                    <Plus size={24} />
                </button>

                <AddItemModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    editingItem={editing}
                />
                <ReviewModal
                    item={reviewItem}
                    onClose={() => setReviewItem(null)}
                />
            </div>
        </PlanGate>
    )
}

export default HouseholdPage