import { useState } from 'react'
import { Sparkles, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { aiService, type AIParseResult } from '@/services/aiService'
import { DS } from '@/lib/design-system'
import { usePlan } from '@/hooks/usePlan'

interface AIParseInputProps {
    onParsed: (result: AIParseResult) => void
}

export const AIParseInput = ({ onParsed }: AIParseInputProps) => {
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { isPlus } = usePlan()
    const [cooldown, setCooldown] = useState(false)

    if (!isPlus) return null

    const hasKey = !!localStorage.getItem('gemini_api_key')

    const handleParse = async () => {
        if (!text.trim() || cooldown) return

        // Disable button 3 giây sau mỗi lần gọi — tránh spam
        setCooldown(true)
        setTimeout(() => setCooldown(false), 3000)

        setLoading(true)
        setError(null)
        try {
            const result = await aiService.parseTransaction(text)
            if (result.success) {
                onParsed(result)
                setText('')
            } else {
                setError(result.errorMessage ?? 'Không thể phân tích')
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Lỗi không xác định')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-primary-50 border border-primary-100">
            {/* Header */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-600">
                <Sparkles size={13} />
                <span>AI Parse</span>
                {!hasKey && (
                    <span className="ml-auto text-amber-600 font-normal">
                        Chưa có API key — vào Settings → AI
                    </span>
                )}
            </div>

            {/* Textarea thay vì input — tự giãn theo nội dung */}
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={`Nhập giao dịch bằng tiếng Việt:\nVD: ăn sáng 45k, đổ xăng 150k...`}
                className={`
                    ${DS.inputBase}
                    resize-none min-h-[72px] leading-relaxed
                    text-sm
                `}
                disabled={!hasKey || loading}
                // Ctrl+Enter để parse thay vì Enter (Enter = xuống dòng)
                onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        handleParse()
                    }
                }}
                rows={3}
            />

            <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                    Ctrl+Enter để parse nhanh
                </span>
                <button
                    type="button"
                    onClick={handleParse}
                    disabled={!text.trim() || !hasKey || loading || cooldown}
                    className="
                        px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium
                        disabled:opacity-40 hover:bg-primary-600 transition-colors
                        flex items-center gap-1.5
                    "
                >
                    {loading
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Sparkles size={12} />
                    }
                    {cooldown ? 'Đợi...' : 'Parse'}
                </button>
            </div>

            {error && (
                <div className="flex items-start gap-1.5 text-xs text-danger-600 bg-danger-50 rounded-lg px-2.5 py-2">
                    <X size={11} className="mt-0.5 shrink-0" />
                    {/* break-all: cho phép cắt chữ ở bất kỳ ký tự nào — quan trọng cho URL dài */}
                    {/* min-w-0: cho phép flex child co lại thay vì ép khung cha giãn ra */}
                    <span className="break-all min-w-0">{error}</span>
                </div>
            )}
        </div>
    )
}