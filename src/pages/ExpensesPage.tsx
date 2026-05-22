import { useState, useEffect, useRef } from 'react'
import { DS } from '@/lib/design-system'
import { Button } from '@/components/shared/Button'
import { TransactionList } from '@/components/transactions/TransactionList'
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal'
import { Download, Plus, Search, X, FileText } from 'lucide-react'
import type { FilterType, TransactionType } from '@/types/transaction'
import { exportService } from '@/services/exportService'
import { notify } from '@/lib/toast'
import { ExportModal } from '@/components/transactions/ExportModal'

// ─── Export Date Range Modal ──────────────────────────────────────────────────
interface ExportParams {
    year: number
    month?: number
    format: 'excel' | 'pdf'
}

interface ExportModalProps {
    isOpen: boolean
    onClose: () => void
    onExport: (params: ExportParams) => void
    isLoading: boolean
}

// ─── ExpensesPage ─────────────────────────────────────────────────────────────

const ExpensesPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isExportOpen, setIsExportOpen] = useState(false)
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL')
    const [isExporting, setIsExporting] = useState(false)

    // ── Search state với debounce ──────────────────────────────────────────────
    const [searchInput, setSearchInput] = useState('')   // giá trị đang gõ
    const [searchQuery, setSearchQuery] = useState('')   // giá trị đã debounce → gửi lên API

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    /**
     * Debounce search 400ms.
     *
     * Tại sao debounce?
     * → Tránh gọi API mỗi ký tự gõ (quá nhiều request)
     * → 400ms: đủ chờ user gõ xong một từ mà không cảm thấy lag
     * → useRef thay vì useState để không trigger re-render
     */
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setSearchQuery(searchInput)
        }, 400)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [searchInput])

    // Map FilterType → TransactionType cho AddTransactionModal
    const defaultTypeForModal: TransactionType =
        activeFilter === 'INCOME' ? 'INCOME' : 'EXPENSE'

    // ── Export handler ─────────────────────────────────────────────────────────

    const handleExport = async ({ year, month, format }: ExportParams) => {
        setIsExporting(true)
        try {
            if (format === 'pdf') {
                await exportService.downloadPdf(year, month)
                notify.success('Xuất PDF thành công')
            } else {
                await exportService.downloadExcel(year, month)
                notify.success('Xuất Excel thành công')
            }
            setIsExportOpen(false)
        } catch {
            notify.error('Xuất thất bại, thử lại sau')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={DS.heading1}>Giao dịch</h1>
                    <p className={DS.muted}>Lịch sử thu chi của bạn</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden md:block">
                        <Button
                            leftIcon={<Plus size={16} />}
                            onClick={() => setIsModalOpen(true)}
                        >
                            Thêm mới
                        </Button>
                    </div>

                    {/* Export button — mở modal chọn kỳ + định dạng */}
                    <Button
                        variant="ghost"
                        leftIcon={<Download size={16} />}
                        onClick={() => setIsExportOpen(true)}
                    >
                        Xuất
                    </Button>
                </div>
            </div>

            {/* ── Search bar ────────────────────────────────────────────────────
             *
             * Thiết kế UX:
             * - Luôn hiện (không ẩn sau icon) → user thấy ngay có thể tìm kiếm
             * - Icon X xuất hiện khi có nội dung → xóa nhanh 1 click
             * - Placeholder gợi ý nội dung có thể tìm
             * - Debounce 400ms ở useEffect phía trên
             */}
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Tìm theo ghi chú hoặc tên ví..."
                    className={`${DS.inputBase} pl-9 pr-9`}
                />
                {/* Nút xóa search */}
                {searchInput && (
                    <button
                        onClick={() => { setSearchInput(''); setSearchQuery('') }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                        aria-label="Xóa tìm kiếm"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Hiển thị badge khi đang search */}
            {searchQuery && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Kết quả cho:</span>
                    <span className="
                        inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                        bg-primary-50 text-primary-700 text-xs font-medium
                    ">
                        "{searchQuery}"
                        <button
                            onClick={() => { setSearchInput(''); setSearchQuery('') }}
                            className="ml-0.5 hover:text-primary-900"
                        >
                            <X size={11} />
                        </button>
                    </span>
                </div>
            )}

            {/* Danh sách — truyền search + filter xuống */}
            <TransactionList
                activeFilter={activeFilter}
                onFilterChange={f => { setActiveFilter(f); setSearchQuery(''); setSearchInput('') }}
                searchQuery={searchQuery}
            />

            {/* FAB mobile */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="
                    fixed bottom-20 right-4 z-40 md:hidden
                    w-14 h-14 rounded-full
                    bg-primary-500 text-white
                    flex items-center justify-center
                    shadow-lg shadow-primary-200
                    hover:bg-primary-600 active:scale-95 transition-all
                "
                aria-label="Thêm giao dịch"
            >
                <Plus size={24} />
            </button>

            {/* Add Transaction Modal */}
            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                defaultType={defaultTypeForModal}
            />

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
            />
        </div>
    )
}

export default ExpensesPage