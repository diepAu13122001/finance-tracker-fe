import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingDown, ChevronRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { DS } from '@/lib/design-system'
import { useTopSpending } from '@/hooks/useCategories'
import { Skeleton } from '@/components/shared/Skeleton'
import { formatVND } from '@/utils/format'
import { usePlan } from '@/hooks/usePlan'

const toPascalCase = (s: string) =>
    s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

type PeriodMode = 'month' | 'quarter' | 'year'

export const TopSpendingWidget = () => {
    const navigate = useNavigate()
    const { isPlus } = usePlan()
    const [mode, setMode] = useState<PeriodMode>('month')

    if (!isPlus) return null

    const now = new Date()
    const params = (() => {
        const year = now.getFullYear()
        if (mode === 'month') return { year, month: now.getMonth() + 1, limit: 3 }
        if (mode === 'quarter') return { year, quarter: Math.ceil((now.getMonth() + 1) / 3), limit: 3 }
        return { year, limit: 3 }
    })()

    const { data, isLoading } = useTopSpending(params)

    if (isLoading) {
        return (
            <div className={DS.card}>
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="flex flex-col gap-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
            </div>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div className={DS.card}>
                <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={18} className="text-danger-500" />
                    <span className={DS.heading3}>Top chi tiêu</span>
                </div>
                <p className={`${DS.muted} text-center py-4`}>
                    Chưa có giao dịch nào trong kỳ này
                </p>
            </div>
        )
    }

    return (
        <div className={DS.card}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <TrendingDown size={18} className="text-danger-500" />
                    <span className={DS.heading3}>Top chi tiêu</span>
                </div>

                <div className="flex p-0.5 bg-surface-muted rounded-md text-xs">
                    {([
                        { key: 'month' as const, label: 'Tháng' },
                        { key: 'quarter' as const, label: 'Quý' },
                        { key: 'year' as const, label: 'Năm' },
                    ]).map(tab => (
                        <button key={tab.key} onClick={() => setMode(tab.key)}
                            className={`px-2 py-1 rounded transition-colors ${mode === tab.key
                                ? 'bg-white text-text-primary shadow-sm'
                                : 'text-text-muted hover:text-text-primary'
                                }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {data.map((item, idx) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const IconComp = (Icons as any)[toPascalCase(item.icon)] || Icons.Tag

                    // ── FIX LỖI #4: dùng effectiveBudget cho cả % và tooltip ──
                    // budgetProgressPercent từ backend đã tính theo effectiveBudget
                    const hasBudget = item.effectiveBudget !== null && item.effectiveBudget !== undefined && item.effectiveBudget > 0

                    return (
                        <div key={item.categoryId}
                            onClick={() => navigate('/categories')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                                hover:bg-surface-muted cursor-pointer transition-colors">
                            <span className="text-xs font-bold text-text-muted w-4">{idx + 1}</span>

                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: item.color + '20', color: item.color }}>
                                <IconComp size={16} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-semibold text-text-primary truncate">
                                        {item.name}
                                    </span>
                                    {item.overBudget && (
                                        <span className="text-xs px-1 py-0 rounded bg-danger-100 text-danger-700 font-bold">
                                            Vượt
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-text-muted">
                                    {item.transactionCount} giao dịch
                                    {hasBudget && item.budgetProgressPercent !== null && (
                                        <span className={`ml-1 font-medium ${item.overBudget ? 'text-danger-600' : 'text-text-secondary'
                                            }`}>
                                            · {item.budgetProgressPercent.toFixed(0)}% ngân sách
                                        </span>
                                    )}
                                </div>
                                {/* Hiển thị effective budget nếu có rollover */}
                                {hasBudget && item.rolloverAmount !== null && item.rolloverAmount !== 0 && (
                                    <div className="text-xs text-text-muted mt-0.5">
                                        Ngân sách kỳ: {formatVND(item.effectiveBudget!)}
                                        {item.rolloverAmount! > 0
                                            ? <span className="text-success-600 ml-1">(+{formatVND(item.rolloverAmount!)} dư)</span>
                                            : <span className="text-danger-600 ml-1">({formatVND(item.rolloverAmount!)} lố)</span>
                                        }
                                    </div>
                                )}
                            </div>

                            <div className="text-right flex-shrink-0">
                                <div className="text-sm font-bold text-danger-600">
                                    {formatVND(item.totalSpent)}
                                </div>
                            </div>

                            <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}