import { useMemo, useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionItem } from './TransactionItem'
import { AddTransactionModal } from './AddTransactionModal'
import { FilterTabs } from './FilterTabs'
import { DS } from '@/lib/design-system'
import { Button } from '@/components/shared/Button'
import { formatRelativeDateVI } from '@/utils/format'
import type { TransactionResponse, FilterType, TransactionType } from '@/services/transactionService'
import { TransactionItemSkeleton, Skeleton } from '@/components/shared/Skeleton'
import { NoTransactionsEmptyState } from '../shared/EmptyState'
import { Search } from 'lucide-react'

// ─── Helper: group by date ────────────────────────────────────────────────────

const groupByDate = (transactions: TransactionResponse[]) =>
    transactions.reduce<Record<string, TransactionResponse[]>>(
        (groups, t) => ({
            ...groups,
            [t.transactionDate]: [...(groups[t.transactionDate] ?? []), t],
        }),
        {}
    )

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransactionListProps {
    activeFilter?: FilterType
    onFilterChange?: (f: FilterType) => void
    /** Text search — debounced ở ExpensesPage, truyền thẳng vào API */
    searchQuery?: string
}

type EditTransactionData = {
    id: string
    type: TransactionType
    amount: number
    note: string | null
    transactionDate: string
    categoryId: string | null
    walletId: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TransactionList = ({
    activeFilter: externalFilter,
    onFilterChange: externalOnChange,
    searchQuery = '',  // 👈 THÊM
}: TransactionListProps = {}) => {

    const [page, setPage] = useState(0)
    const [internalFilter, setInternal] = useState<FilterType>('ALL')
    const [editData, setEditData] = useState<EditTransactionData | null>(null)
    const [isModalOpen, setIsModal] = useState(false)

    const filter = externalFilter ?? internalFilter

    // 👇 THÊM: pass searchQuery vào hook → hook pass vào service → gửi lên API
    const { data, isLoading, error, refetch } = useTransactions(
        page, filter, undefined, searchQuery || undefined
    )

    const handleFilterChange = (newFilter: FilterType) => {
        if (externalOnChange) externalOnChange(newFilter)
        else setInternal(newFilter)
        setPage(0)
    }

    const grouped = useMemo(
        () => groupByDate(data?.content ?? []),
        [data?.content]
    )
    const dates = useMemo(
        () => Object.keys(grouped).sort((a, b) => b.localeCompare(a)),
        [grouped]
    )

    // ── Loading ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                <Skeleton className="h-9 w-64 rounded-lg" />
                <div className={`${DS.card} flex flex-col gap-1`}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <TransactionItemSkeleton key={i} />
                    ))}
                </div>
            </div>
        )
    }

    // ── Error ─────────────────────────────────────────────────────────────────

    if (error) {
        return (
            <div className={DS.card}>
                <p className="text-danger-600 text-sm mb-2">Không thể tải giao dịch.</p>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col gap-3">

                <FilterTabs active={filter} onChange={handleFilterChange} />

                {/* Empty state — phân biệt 2 trường hợp: search không có kết quả vs chưa có giao dịch */}
                {dates.length === 0 ? (
                    <div className={DS.card}>
                        {searchQuery ? (
                            /* Empty state khi search không tìm thấy */
                            <div className="flex flex-col items-center py-12 gap-3 text-center">
                                <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center">
                                    <Search size={20} className="text-text-muted" />
                                </div>
                                <div>
                                    <p className={DS.heading3}>Không tìm thấy kết quả</p>
                                    <p className={`${DS.muted} mt-1`}>
                                        Không có giao dịch nào khớp với "<strong>{searchQuery}</strong>"
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <NoTransactionsEmptyState
                                onAdd={() => setIsModal(true)}
                                filter={filter}
                            />
                        )}
                    </div>
                ) : (
                    <div className={`${DS.card} flex flex-col gap-1`}>
                        {dates.map(date => (
                            <div key={date}>
                                <DayHeader date={date} transactions={grouped[date]} />
                                {grouped[date].map(transaction => (
                                    <TransactionItem
                                        key={transaction.id}
                                        transaction={transaction}
                                        onEdit={(t) => {
                                            setEditData({
                                                id: t.id,
                                                type: t.type,
                                                amount: t.amount,
                                                note: t.note,
                                                transactionDate: t.transactionDate,
                                                categoryId: t.category?.id ?? null,
                                                walletId: t.wallet?.id ?? null,
                                            })
                                            setIsModal(true)
                                        }}
                                    />
                                ))}
                            </div>
                        ))}

                        {(data?.totalPages ?? 0) > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border mt-2">
                                <span className={DS.muted}>
                                    {data?.content.length} / {data?.totalElements} giao dịch
                                    {searchQuery && ` khớp với "${searchQuery}"`}
                                </span>
                                <div className="flex gap-2">
                                    {!data?.first && (
                                        <Button variant="ghost" size="sm" onClick={() => setPage(p => p - 1)}>
                                            ← Trước
                                        </Button>
                                    )}
                                    {!data?.last && (
                                        <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)}>
                                            Tiếp →
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => { setIsModal(false); setEditData(null) }}
                onSuccess={() => { }}
                editData={editData}
                defaultType={editData?.type ?? (filter === 'INCOME' ? 'INCOME' : 'EXPENSE')}
            />
        </>
    )
}

// ─── DayHeader ────────────────────────────────────────────────────────────────

const DayHeader = ({
    date,
    transactions,
}: {
    date: string
    transactions: TransactionResponse[]
}) => (
    <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-medium text-text-muted">
            {formatRelativeDateVI(date)}
        </span>
    </div>
)