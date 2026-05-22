import { useState } from 'react'
import { DS } from '@/lib/design-system'
import { Button } from '@/components/shared/Button'
import { exportService } from '@/services/exportService'
import { notify } from '@/lib/toast'
import { getErrorMessage, getErrorCode } from '@/utils/errorUtils'


// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1  // 1-based

/**
 * Kiểm tra kỳ được chọn có ở tương lai không.
 * - Năm tương lai (year > CURRENT_YEAR) → tương lai
 * - Năm hiện tại nhưng tháng chưa đến  → tương lai
 * - Năm hiện tại, không chọn tháng     → OK (cả năm, phần đã qua có data)
 */
const isFuture = (year: number, month: number | ''): boolean => {
    if (year > CURRENT_YEAR) return true
    if (year === CURRENT_YEAR && month !== '' && month > CURRENT_MONTH) return true
    return false
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExportModalProps {
    isOpen: boolean
    onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
    const [year, setYear] = useState(CURRENT_YEAR)
    const [month, setMonth] = useState<number | ''>(CURRENT_MONTH)
    const [format, setFormat] = useState<'excel' | 'pdf'>('excel')
    const [isLoading, setIsLoading] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)

    if (!isOpen) return null

    const future = isFuture(year, month)

    // ── Handler ──────────────────────────────────────────────────────────────

    const handleExport = async () => {
        if (future) return  // double-guard (nút đã disabled)
        setServerError(null)
        setIsLoading(true)
        try {
            const m = month !== '' ? month : undefined

            if (format === 'pdf') {
                await exportService.downloadPdf(year, m)
                notify.success('Xuất PDF thành công')
            } else {
                await exportService.downloadExcel(year, m)
                notify.success('Xuất Excel thành công')
            }
            onClose()
        } catch (error: unknown) {
            const code = getErrorCode(error)
            const message = getErrorMessage(error, 'Có lỗi xảy ra, vui lòng thử lại')
            setServerError(message)
        } finally {
            setIsLoading(false)
        }
    }

    // Khi đổi năm mà tháng đang chọn > tháng hiện tại (của năm mới = năm hiện tại)
    // → reset tháng về tháng hiện tại để tránh chọn tương lai
    const handleYearChange = (newYear: number) => {
        setYear(newYear)
        if (newYear === CURRENT_YEAR && month !== '' && month > CURRENT_MONTH) {
            setMonth(CURRENT_MONTH)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className={`${DS.card} w-full max-w-sm flex flex-col gap-4`}>

                <h3 className={DS.heading2}>Xuất báo cáo</h3>

                {serverError && (
                    <div className="bg-danger-50 border border-danger-500 rounded-lg px-4 py-3 mb-4">
                        <p className="text-sm text-danger-600">{serverError}</p>
                    </div>
                )}

                {/* ── Chọn năm ──────────────────────────────────────────────────── */}
                <div className="flex flex-col gap-1.5">
                    <label className={DS.label}>Năm</label>
                    <select
                        value={year}
                        onChange={e => handleYearChange(Number(e.target.value))}
                        className={DS.inputBase}
                    >
                        {/* Chỉ cho chọn năm hiện tại trở về trước */}
                        {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* ── Chọn tháng ────────────────────────────────────────────────── */}
                <div className="flex flex-col gap-1.5">
                    <label className={DS.label}>Tháng</label>
                    <select
                        value={month}
                        onChange={e => setMonth(e.target.value === '' ? '' : Number(e.target.value))}
                        className={DS.inputBase}
                    >
                        <option value="">— Cả năm —</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                            // Disable các tháng tương lai (chỉ khi đang chọn năm hiện tại)
                            const disabled = year === CURRENT_YEAR && m > CURRENT_MONTH
                            return (
                                <option key={m} value={m} disabled={disabled}>
                                    Tháng {m}{disabled ? ' (chưa đến)' : ''}
                                </option>
                            )
                        })}
                    </select>
                    <p className={DS.muted}>
                        Bỏ trống để xuất cả năm {year}
                    </p>
                </div>

                {/* ── Cảnh báo tương lai ────────────────────────────────────────── */}
                {future && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
                        <span className="text-amber-500 mt-0.5">⚠</span>
                        <p className="text-sm text-amber-700">
                            Kỳ này chưa đến. Vui lòng chọn tháng/năm hiện tại hoặc trước đó.
                        </p>
                    </div>
                )}

                {/* ── Chọn định dạng ────────────────────────────────────────────── */}
                <div className="flex flex-col gap-1.5">
                    <label className={DS.label}>Định dạng</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-surface-muted rounded-lg">
                        {([
                            { key: 'excel' as const, label: '📊 Excel (.xlsx)', desc: 'Chỉnh sửa, lọc dữ liệu' },
                            { key: 'pdf' as const, label: '📄 PDF', desc: 'In ấn, gửi email' },
                        ]).map(f => (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setFormat(f.key)}
                                className={`
                  py-2 px-3 rounded-md text-left transition-all
                  ${format === f.key
                                        ? 'bg-white shadow-sm'
                                        : 'text-text-secondary hover:text-text-primary'
                                    }
                `}
                            >
                                <div className="text-sm text-text-primary font-medium">{f.label}</div>
                                <div className="text-xs text-text-muted">{f.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Buttons ───────────────────────────────────────────────────── */}
                <div className="flex gap-2 mt-1">
                    <Button variant="ghost" onClick={onClose} className="flex-1">
                        Hủy
                    </Button>
                    <Button
                        onClick={handleExport}
                        loading={isLoading}
                        disabled={future}
                        className="flex-1"
                    >
                        Xuất {format === 'excel' ? 'Excel' : 'PDF'}
                    </Button>
                </div>

            </div>
        </div>
    )
}