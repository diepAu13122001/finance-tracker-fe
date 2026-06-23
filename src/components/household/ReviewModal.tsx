import { useState } from 'react'
import { X, Star } from 'lucide-react'
import { DS } from '@/lib/design-system'
import { Button } from '@/components/shared/Button'
import { useAddReview } from '@/hooks/useHousehold'
import type { HouseholdItemResponse } from '@/types/household'

interface ReviewModalProps {
    item: HouseholdItemResponse | null   // null = đóng
    onClose: () => void
}

export const ReviewModal = ({ item, onClose }: ReviewModalProps) => {
    const [rating, setRating] = useState(0)
    const [hovered, setHovered] = useState(0)
    const [reviewText, setReviewText] = useState('')
    const [wouldBuyAgain, setWouldBuy] = useState<boolean | undefined>(undefined)
    const addReview = useAddReview()

    const handleSubmit = async () => {
        if (!item || rating === 0) return
        await addReview.mutateAsync({
            id: item.id,
            req: { rating, reviewText: reviewText || undefined, wouldBuyAgain },
        })
        onClose()
    }

    if (!item) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className={`${DS.card} w-full max-w-sm flex flex-col gap-4`}>

                <div className="flex items-center justify-between">
                    <h2 className={DS.heading2}>Đánh giá sản phẩm</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-muted text-text-muted">
                        <X size={18} />
                    </button>
                </div>

                <p className="text-sm text-text-muted">
                    Bạn vừa dùng hết <strong className="text-text-primary">{item.name}</strong>.
                    Đánh giá để nhớ lần sau!
                </p>

                {/* Star rating */}
                <div className="flex flex-col gap-2 items-center">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star}
                                type="button"
                                onMouseEnter={() => setHovered(star)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110">
                                <Star
                                    size={32}
                                    fill={(hovered || rating) >= star ? '#f59e0b' : 'none'}
                                    color={(hovered || rating) >= star ? '#f59e0b' : '#d1d5db'}
                                />
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-text-muted">
                        {rating === 0 ? 'Chọn số sao' :
                            rating === 1 ? 'Tệ 😞' : rating === 2 ? 'Không tốt 😐' :
                                rating === 3 ? 'Ổn 🙂' : rating === 4 ? 'Tốt 😊' : 'Xuất sắc 🌟'}
                    </span>
                </div>

                {/* Ghi chú */}
                <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Cảm nhận của bạn..."
                    className={`${DS.inputBase} resize-none h-20 text-sm`}
                    rows={3}
                />

                {/* Sẽ mua lại? */}
                <div>
                    <label className={DS.label}>Sẽ mua lại không?</label>
                    <div className="flex gap-2 mt-2">
                        {[
                            { val: true, label: '✅ Có, sẽ mua lại' },
                            { val: false, label: '❌ Không' },
                        ].map(opt => (
                            <button key={String(opt.val)} type="button"
                                onClick={() => setWouldBuy(opt.val)}
                                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all
                                    ${wouldBuyAgain === opt.val
                                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                                        : 'border-surface-border text-text-secondary'
                                    }`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onClose} className="flex-1">Bỏ qua</Button>
                    <Button
                        disabled={rating === 0}
                        loading={addReview.isPending}
                        onClick={handleSubmit}
                        className="flex-1">
                        Lưu đánh giá
                    </Button>
                </div>
            </div>
        </div>
    )
}