import { useState } from 'react'
import { DS } from '@/lib/design-system'
import { aiService, AIAnalyzeResult } from '@/services/aiService'
import { notify } from '@/lib/toast'

interface Props {
  year: number
  month: number
}

/**
 * Card hiển thị AI insights cho tháng được chọn.
 *
 * Pattern:
 *   - Lazy load: chỉ gọi API khi user bấm "Phân tích"
 *   - Tránh auto-fetch → tốn quota Gemini key của user
 *   - Reset khi year/month thay đổi → user biết cần bấm lại
 */
export const AIInsightsCard = ({ year, month }: Props) => {
    const [result, setResult] = useState<AIAnalyzeResult | null>(null)
    const [loading, setLoading] = useState(false)

    const analyze = async () => {
        setLoading(true)
        setResult(null)
        try {
            const data = await aiService.analyzeSpending(year, month)
            if (!data.success) {
                notify.error(data.errorMessage ?? 'Phân tích thất bại')
            } else {
                setResult(data)
            }
        } catch (err: any) {
            notify.error(err.message ?? 'Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className={DS.heading2}>🤖 AI Insights</h3>
                    <p className={DS.muted}>Tháng {month}/{year} — phân tích bằng Gemini</p>
                </div>
                <button
                    onClick={analyze}
                    disabled={loading}
                    className={`${DS.btnPrimary} text-sm`}
                >
                    {loading ? 'Đang phân tích...' : 'Phân tích'}
                </button>
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div className="flex flex-col gap-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-4 bg-surface-muted rounded w-full" />
                    ))}
                    <div className="h-4 bg-surface-muted rounded w-3/4" />
                </div>
            )}

            {/* Result */}
            {result && !loading && (
                <div className="flex flex-col gap-4">

                    {/* Warnings — hiện trước nếu có */}
                    {result.warnings.length > 0 && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex flex-col gap-1">
                            {result.warnings.map((w, i) => (
                                <p key={i} className="text-sm text-red-700">⚠️ {w}</p>
                            ))}
                        </div>
                    )}

                    {/* Overview */}
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Tổng quan</p>
                        <p className="text-sm text-text-primary">{result.overview}</p>
                    </div>

                    {/* Top insight */}
                    <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                        <p className="text-xs font-semibold text-purple-600 mb-1">Insight nổi bật</p>
                        <p className="text-sm text-text-primary">{result.topInsight}</p>
                    </div>

                    {/* Suggestion */}
                    <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                        <p className="text-xs font-semibold text-green-600 mb-1">Gợi ý cải thiện</p>
                        <p className="text-sm text-text-primary">{result.suggestion}</p>
                    </div>

                    <p className="text-xs text-text-muted text-right">
                        Powered by Gemini · Kết quả chỉ mang tính tham khảo
                    </p>
                </div>
            )}

            {/* Empty state */}
            {!result && !loading && (
                <p className={`${DS.muted} text-center py-4`}>
                    Bấm "Phân tích" để Gemini đánh giá chi tiêu tháng {month}/{year} của bạn.
                </p>
            )}
        </div>
    )
}
