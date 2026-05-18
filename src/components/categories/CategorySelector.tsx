import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { CategoryBadge } from './CategoryBadge'
import { DS } from '@/lib/design-system'
import { Link } from 'react-router-dom'
import type { TransactionType } from '@/types/transaction'
import type { CategoryResponse } from '@/types/category'

interface CategorySelectorProps {
    value: string | null
    onChange: (categoryId: string | null) => void
    type: TransactionType
    label?: string
}

export const CategorySelector = ({
    value,
    onChange,
    type,
    label = 'Danh mục',
}: CategorySelectorProps) => {

    const { data: categories, isLoading } = useCategories(type)
    const [open, setOpen] = useState(false)

    const selected = categories?.find(c => c.id === value) ?? null

    // Helper tìm category trong tree (kể cả children)
    const findInTree = (id: string | null): CategoryResponse | null => {
        if (!id || !categories) return null
        for (const root of categories) {
            if (root.id === id) return root
            const child = root.children?.find(c => c.id === id)
            if (child) return child
        }
        return null
    }

    return (
        <div className="relative">
            {label && (
                <label className={DS.label}>{label}</label>
            )}

            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`
          ${DS.inputBase}
          flex items-center justify-between
          cursor-pointer
          {selected ? 'py-1.5' : ''} 
        `}
            >


                const selected = findInTree(value)

                // Render selected: nếu có parentName thì hiện "Parent → Child"
                {selected && (
                    <div className="flex items-center gap-1.5">
                        {selected.parentName && (
                            <>
                                <span className="text-xs text-text-muted">{selected.parentName}</span>
                                <ChevronRight size={10} className="text-text-muted" />
                            </>
                        )}
                        <CategoryBadge category={selected} size="sm" />
                    </div>
                )}
                <ChevronDown
                    size={16}
                    className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <>
                    {/* Backdrop để đóng khi click ngoài */}
                    <div
                        className="fixed inset-0 z-30"
                        onClick={() => setOpen(false)}
                    />

                    <div className="
            absolute z-40 mt-1 w-full
            bg-white rounded-lg shadow-lg
            border border-surface-border
            max-h-60 overflow-y-auto
            animate-in fade-in slide-in-from-top-2 duration-150
          ">
                        {/* Option: Bỏ chọn */}
                        <button
                            type="button"
                            onClick={() => { onChange(null); setOpen(false) }}
                            className="
                w-full px-3 py-2 text-left text-sm
                hover:bg-surface-muted transition-colors
                flex items-center gap-2
              "
                        >
                            <span className="text-text-muted italic">Không phân loại</span>
                        </button>

                        {/* Loading */}
                        {isLoading && (
                            <div className="px-3 py-3 text-sm text-text-muted">
                                Đang tải...
                            </div>
                        )}

                        {/* Categories list — render dạng tree */}
                        {!isLoading && categories?.map(root => (
                            <div key={root.id}>
                                {/* Root option */}
                                <button
                                    type="button"
                                    onClick={() => { onChange(root.id); setOpen(false) }}
                                    className={`
                w-full px-3 py-2 text-left
                hover:bg-surface-muted transition-colors
                flex items-center gap-2 font-semibold
                ${value === root.id ? 'bg-surface-muted' : ''}
            `}
                                >
                                    <CategoryBadge category={root} size="sm" />
                                </button>

                                {/* Children — indent */}
                                {root.children?.map(child => (
                                    <button
                                        key={child.id}
                                        type="button"
                                        onClick={() => { onChange(child.id); setOpen(false) }}
                                        className={`
                    w-full pl-8 pr-3 py-2 text-left
                    hover:bg-surface-muted transition-colors
                    flex items-center gap-2
                    ${value === child.id ? 'bg-surface-muted' : ''}
                `}
                                    >
                                        <span className="text-text-muted">└</span>
                                        <CategoryBadge category={child} size="sm" />
                                    </button>
                                ))}
                            </div>
                        ))}

                        {/* Empty state với link tạo mới */}
                        {!isLoading && (!categories || categories.length === 0) && (
                            <Link
                                to="/categories"
                                className="
                  block px-3 py-3 text-sm text-primary-600
                  hover:bg-primary-50 transition-colors
                  border-t border-surface-border
                  flex items-center gap-2
                "
                                onClick={() => setOpen(false)}
                            >
                                <Plus size={14} />
                                Tạo danh mục đầu tiên
                            </Link>
                        )}

                        {/* Footer link */}
                        {!isLoading && categories && categories.length > 0 && (
                            <Link
                                to="/categories"
                                className="
                  block px-3 py-2 text-xs text-primary-600
                  hover:bg-primary-50 transition-colors
                  border-t border-surface-border
                  flex items-center gap-1.5
                "
                                onClick={() => setOpen(false)}
                            >
                                <Plus size={12} />
                                Quản lý danh mục
                            </Link>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
