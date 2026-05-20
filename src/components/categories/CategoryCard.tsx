import { Pencil, Trash2, ChevronRight } from 'lucide-react'  // 👈 THÊM ChevronRight
import * as Icons from 'lucide-react'
import { DS } from '@/lib/design-system'
import { useDeleteCategory } from '@/hooks/useCategories'
import { formatVND } from '@/utils/format'  // 👈 THÊM
import type { CategoryResponse } from '@/types/category'
import { useState } from 'react'

const toPascalCase = (str: string): string =>
    str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')

interface CategoryCardProps {
    category: CategoryResponse
    onEdit: () => void
    onClick?: () => void  // 👈 THÊM: navigate to expenses
}

export const CategoryCard = ({ category, onEdit, onClick }: CategoryCardProps) => {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const deleteMutation = useDeleteCategory()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (Icons as any)[toPascalCase(category.icon)] || Icons.Tag

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()  // 👈 THÊM: không trigger onClick của card
        if (!confirmDelete) {
            setConfirmDelete(true)
            setTimeout(() => setConfirmDelete(false), 3000)
            return
        }
        deleteMutation.mutate(category.id)
        setConfirmDelete(false)
    }

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation()  // 👈 THÊM
        onEdit()
    }

    return (
        <div
            className={`
                ${DS.card}
                flex items-center gap-3
                transition-all hover:shadow-md
                ${onClick ? 'cursor-pointer hover:border-primary-200' : ''}
            `}
            onClick={onClick}
        >
            {/* Icon */}
            <div
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: category.color + '20', color: category.color }}
            >
                <IconComponent size={20} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text-primary truncate">
                        {category.name}
                    </span>
                    {/* Badge cảnh báo */}
                    {category.overBudget && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-danger-100 text-danger-700 font-bold">
                            Vượt ngân sách
                        </span>
                    )}
                    {category.warningBudget && !category.overBudget && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                            Sắp hết
                        </span>
                    )}
                </div>

                <div className="text-xs text-text-muted flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span>{category.type === 'INCOME' ? '↑ Thu nhập' : '↓ Chi tiêu'}</span>
                    {category.transactionCount !== undefined && (
                        <span>· {category.transactionCount} giao dịch</span>
                    )}
                    {category.totalAmount !== undefined && category.totalAmount > 0 && (
                        <span className="font-medium" style={{ color: category.color }}>
                            · {formatVND(category.totalAmount)}
                        </span>
                    )}
                </div>

                {/* Budget progress với rollover info */}
                {category.monthlyBudget && category.monthlyBudget > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-text-muted">
                                {formatVND(category.currentMonthSpent ?? 0)}
                                {' / '}
                                {formatVND(category.effectiveBudget ?? category.monthlyBudget)}
                            </span>
                            <span
                                className={`font-bold ${category.overBudget ? 'text-danger-600'
                                        : category.warningBudget ? 'text-amber-600'
                                            : 'text-text-secondary'
                                    }`}
                            >
                                {(category.budgetProgressPercent ?? 0).toFixed(0)}%
                            </span>
                        </div>

                        <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(category.budgetProgressPercent ?? 0, 100)}%`,
                                    backgroundColor: category.overBudget ? '#ef4444'
                                        : category.warningBudget ? '#f59e0b'
                                            : category.color,
                                }}
                            />
                        </div>

                        {/* Hiển thị rollover nếu có */}
                        {category.rolloverAmount !== undefined && category.rolloverAmount !== 0 && (
                            <p className="text-xs">
                                {category.rolloverAmount > 0 ? (
                                    <span className="text-success-600">
                                        ↪ Dư tháng trước: +{formatVND(category.rolloverAmount)}
                                    </span>
                                ) : (
                                    <span className="text-danger-600">
                                        ↪ Lố tháng trước: {formatVND(category.rolloverAmount)}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={handleEdit}
                    className="p-2 rounded-md text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors"
                    aria-label="Sửa"
                >
                    <Pencil size={14} />
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className={`
                        p-2 rounded-md transition-all duration-200
                        ${confirmDelete
                            ? 'bg-danger-500 text-white scale-110'
                            : 'text-text-muted hover:bg-surface-border hover:text-danger-500'
                        }
                    `}
                    aria-label={confirmDelete ? 'Xác nhận xóa' : 'Xóa'}
                >
                    <Trash2 size={14} />
                </button>
                {/* 👇 THÊM: icon navigate */}
                {onClick && (
                    <ChevronRight size={14} className="text-text-muted ml-1" />
                )}
            </div>
        </div>
    )
}