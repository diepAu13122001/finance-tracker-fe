import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { DS } from '@/lib/design-system'
import { useCategories } from '@/hooks/useCategories'
import { CategoryCard } from '@/components/categories/CategoryCard'
import { CategoryFormModal } from '@/components/categories/CategoryFormModal'
import { CategoryTransactionsDrawer } from '@/components/categories/CategoryTransactionsDrawer'
import { animations } from '@/lib/animations'
import type { CategoryResponse } from '@/types/category'
import type { TransactionType } from '@/types/transaction'
import { usePlan } from '@/hooks/usePlan'
import { UpgradePrompt } from '@/components/shared'

const CategoriesPage = () => {
    const { isPlus } = usePlan()

    if (!isPlus) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <h1 className={DS.heading1}>Danh mục</h1>
                <p className={DS.muted}>Bấm vào danh mục để xem giao dịch</p>
                <div className="mt-6"><UpgradePrompt requiredPlan="PLUS" layout="card" /></div>
            </div>
        )
    }

    const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL')
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<CategoryResponse | null>(null)
    const [drawerCategory, setDrawerCategory] = useState<CategoryResponse | null>(null)
    // Track expand state cho mỗi root
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    // Pre-fill parent khi click "+ thêm con" trong tree
    const [presetParent, setPresetParent] = useState<CategoryResponse | null>(null)

    const typeParam = filterType === 'ALL' ? undefined : filterType
    const { data: categories, isLoading } = useCategories(typeParam)

    const toggleExpand = (id: string) =>
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

    const openCreate = (parent: CategoryResponse | null = null) => {
        setEditing(null)
        setPresetParent(parent)
        setModalOpen(true)
    }
    const openEdit = (cat: CategoryResponse) => {
        setEditing(cat)
        setPresetParent(null)
        setModalOpen(true)
    }

    return (
        <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
            <div className={`flex items-center justify-between ${animations.fadeInUp}`}>
                <div>
                    <h1 className={DS.heading1}>Danh mục</h1>
                    <p className={DS.muted}>Tổ chức 2 cấp: nhóm chính + nhóm con</p>
                </div>
                <div className="hidden md:block">
                    <Button leftIcon={<Plus size={16} />} onClick={() => openCreate(null)}>
                        Thêm nhóm chính
                    </Button>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-surface-muted rounded-lg w-fit">
                {([
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'EXPENSE', label: 'Chi tiêu' },
                    { key: 'INCOME', label: 'Thu nhập' },
                ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setFilterType(tab.key)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
                            ${filterType === tab.key
                                ? 'bg-white text-text-primary shadow-sm'
                                : 'text-text-secondary hover:text-text-primary'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading && <div className="text-center py-12 text-text-muted">Đang tải...</div>}

            {!isLoading && (!categories || categories.length === 0) && (
                <div className={`${DS.card} text-center py-12`}>
                    <p className={DS.heading3}>Chưa có danh mục nào</p>
                    <p className={`${DS.muted} mt-2 mb-4`}>Tạo nhóm chính đầu tiên</p>
                    <Button leftIcon={<Plus size={16} />} onClick={() => openCreate(null)}>
                        Tạo nhóm chính
                    </Button>
                </div>
            )}

            {/* Tree render */}
            {!isLoading && categories && categories.length > 0 && (
                <div className="flex flex-col gap-3">
                    {categories.map(root => {
                        const isExpanded = expanded[root.id] ?? true  // mặc định expand
                        const hasChildren = (root.children?.length ?? 0) > 0

                        return (
                            <div key={root.id} className="flex flex-col gap-2">
                                {/* Root card với toggle expand */}
                                <div className="flex items-center gap-2">
                                    {hasChildren && (
                                        <button
                                            onClick={() => toggleExpand(root.id)}
                                            className="flex-shrink-0 p-1 rounded text-text-muted hover:bg-surface-muted"
                                        >
                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                    )}
                                    {!hasChildren && <div className="w-6 flex-shrink-0" />}
                                    <div className="flex-1">
                                        <CategoryCard
                                            category={root}
                                            onEdit={() => openEdit(root)}
                                            onClick={() => setDrawerCategory(root)}
                                        />
                                    </div>
                                </div>

                                {/* Children — indent 32px */}
                                {hasChildren && isExpanded && (
                                    <div className="pl-8 flex flex-col gap-2">
                                        {root.children!.map(child => (
                                            <CategoryCard
                                                key={child.id}
                                                category={child}
                                                onEdit={() => openEdit(child)}
                                                onClick={() => setDrawerCategory(child)}
                                            />
                                        ))}
                                        {/* Nút thêm con */}
                                        <button
                                            onClick={() => openCreate(root)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg
                                                       border border-dashed border-surface-border
                                                       text-sm text-text-muted hover:text-primary-600
                                                       hover:border-primary-300 transition-colors"
                                        >
                                            <Plus size={14} />
                                            Thêm con vào "{root.name}"
                                        </button>
                                    </div>
                                )}

                                {/* Nếu root không có con: nút thêm con cũng hiện */}
                                {!hasChildren && (
                                    <div className="pl-8">
                                        <button
                                            onClick={() => openCreate(root)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg
                                                       border border-dashed border-surface-border
                                                       text-sm text-text-muted hover:text-primary-600
                                                       hover:border-primary-300 transition-colors"
                                        >
                                            <Plus size={14} />
                                            Thêm con
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* FAB mobile */}
            <button onClick={() => openCreate(null)}
                className="fixed bottom-20 right-4 z-40 md:hidden w-14 h-14 rounded-full
                           bg-primary-500 text-white flex items-center justify-center
                           shadow-lg hover:bg-primary-600 active:scale-95 transition-all">
                <Plus size={24} />
            </button>

            <CategoryFormModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setPresetParent(null) }}
                editingCategory={editing}
                defaultType={filterType === 'ALL' ? 'EXPENSE' : filterType}
                presetParent={presetParent}
            />

            <CategoryTransactionsDrawer
                category={drawerCategory}
                onClose={() => setDrawerCategory(null)}
            />
        </div>
    )
}

export default CategoriesPage