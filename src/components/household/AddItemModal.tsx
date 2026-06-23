import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { DS } from '@/lib/design-system'
import { animations } from '@/lib/animations'
import { useCreateHouseholdItem, useUpdateHouseholdItem } from '@/hooks/useHousehold'
import { ITEM_CATEGORY_CONFIG } from '@/types/household'
import type { HouseholdItemResponse, ItemCategory } from '@/types/household'
import { getErrorMessage } from '@/utils/errorUtils'
import { aiService } from '@/services/aiService'
import { notify } from '@/lib/toast'

const schema = z.object({
    name: z.string().min(1, 'Tên không được để trống').max(200),
    brand: z.string().optional(),
    category: z.enum(['SKINCARE', 'HOUSECARE', 'FOOD', 'CLOTHES', 'OTHER']),
    price: z.string().optional(),
    purchaseDate: z.string().optional(),
    expiryDate: z.string().optional(),
    quantity: z.string().optional(),
    unit: z.string().optional(),
    notifyBeforeDays: z.number().min(1).max(90).optional(),
    notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddItemModalProps {
    isOpen: boolean
    onClose: () => void
    editingItem: HouseholdItemResponse | null
}

export const AddItemModal = ({ isOpen, onClose, editingItem }: AddItemModalProps) => {
    const isEdit = editingItem !== null
    const [serverError, setServerError] = useState<string | null>(null)
    const [aiLoading, setAiLoading] = useState(false)

    const createMutation = useCreateHouseholdItem()
    const updateMutation = useUpdateHouseholdItem()

    const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
        useForm<FormData>({
            resolver: zodResolver(schema),
            defaultValues: { category: 'OTHER', notifyBeforeDays: 7 },
        })

    useEffect(() => {
        if (!isOpen) return
        if (editingItem) {
            reset({
                name: editingItem.name,
                brand: editingItem.brand ?? '',
                category: editingItem.category,
                price: editingItem.price?.toLocaleString('vi-VN') ?? '',
                purchaseDate: editingItem.purchaseDate ?? '',
                expiryDate: editingItem.expiryDate ?? '',
                quantity: editingItem.quantity?.toString() ?? '',
                unit: editingItem.unit ?? '',
                notifyBeforeDays: editingItem.notifyBeforeDays,
                notes: editingItem.notes ?? '',
            })
        } else {
            reset({ category: 'OTHER', notifyBeforeDays: 7 })
        }
        setServerError(null)
    }, [isOpen, editingItem, reset])

    // AI auto-suggest category khi gõ tên sản phẩm
    const handleAISuggest = async () => {
        const name = watch('name')
        const brand = watch('brand')
        if (!name?.trim()) { notify.error('Nhập tên sản phẩm trước'); return }

        const hasKey = !!localStorage.getItem('gemini_api_key')
        if (!hasKey) { notify.error('Chưa có Gemini API key — vào Settings > AI'); return }

        setAiLoading(true)
        try {
            // Gọi endpoint /api/ai/classify-item thay vì /api/ai/parse-transaction
            const result = await aiService.classifyItem(name, brand)

            if (result.success && result.category) {
                // Category từ AI đã đúng format ("SKINCARE", "FOOD"...) → set thẳng
                setValue('category', result.category as ItemCategory)

                const catLabel = ITEM_CATEGORY_CONFIG[result.category as ItemCategory]?.label
                notify.success(
                    `AI phân loại: ${catLabel}${result.subcategory ? ` (${result.subcategory})` : ''}`
                )
            } else {
                notify.error(result.errorMessage ?? 'AI không phân loại được')
            }
        } catch (e: unknown) {
            notify.error(e instanceof Error ? e.message : 'Lỗi không xác định')
        } finally {
            setAiLoading(false)
        }
    }

    const onSubmit = async (data: FormData) => {
        setServerError(null)
        const payload = {
            name: data.name.trim(),
            brand: data.brand || undefined,
            category: data.category,
            price: data.price ? parseInt(data.price.replace(/\./g, '')) : undefined,
            purchaseDate: data.purchaseDate || undefined,
            expiryDate: data.expiryDate || undefined,
            quantity: data.quantity ? parseFloat(data.quantity) : undefined,
            unit: data.unit || undefined,
            notifyBeforeDays: data.notifyBeforeDays,
            notes: data.notes || undefined,
        }
        try {
            if (isEdit && editingItem) {
                await updateMutation.mutateAsync({ id: editingItem.id, req: payload })
            } else {
                await createMutation.mutateAsync(payload)
            }
            onClose()
        } catch (err) {
            setServerError(getErrorMessage(err, 'Có lỗi xảy ra'))
        }
    }

    if (!isOpen) return null

    const selectedCategory = watch('category')

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className={`${DS.card} w-full sm:max-w-md max-h-[90vh] overflow-y-auto ${animations.slideInBottom}`}>

                <div className="flex items-center justify-between mb-5">
                    <h2 className={DS.heading2}>{isEdit ? 'Sửa đồ dùng' : 'Thêm đồ dùng'}</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-muted text-text-muted">
                        <X size={20} />
                    </button>
                </div>

                {serverError && (
                    <div className="bg-danger-50 border border-danger-500 rounded-lg px-4 py-3 mb-4">
                        <p className="text-sm text-danger-600">{serverError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

                    {/* Tên + AI suggest */}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Input label="Tên sản phẩm *"
                                placeholder="Sữa rửa mặt La Roche-Posay..."
                                error={errors.name?.message}
                                {...register('name')} />
                        </div>
                        <button type="button" onClick={handleAISuggest}
                            disabled={aiLoading}
                            title="AI tự phân loại"
                            className="mb-0.5 p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 disabled:opacity-40 transition-colors">
                            <Sparkles size={16} className={aiLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <Input label="Thương hiệu" placeholder="La Roche-Posay, Vim..."
                        {...register('brand')} />

                    {/* Category selector */}
                    <div>
                        <label className={DS.label}>Danh mục</label>
                        <div className="grid grid-cols-5 gap-1.5 mt-2">
                            {(Object.keys(ITEM_CATEGORY_CONFIG) as ItemCategory[]).map(cat => {
                                const cfg = ITEM_CATEGORY_CONFIG[cat]
                                const isSelected = selectedCategory === cat
                                return (
                                    <button key={cat} type="button"
                                        onClick={() => setValue('category', cat)}
                                        className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 text-xs font-medium transition-all
                                            ${isSelected ? 'border-primary-400 bg-primary-50' : 'border-surface-border hover:border-primary-200'}`}>
                                        <span className="text-lg">{cfg.emoji}</span>
                                        <span className="text-center leading-tight">{cfg.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Giá mua (VND)" type="text" placeholder="150.000"
                            {...register('price')} />
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input label="Số lượng" type="number" step="0.1" min="0"
                                    placeholder="500" {...register('quantity')} />
                            </div>
                            <div className="w-20">
                                <Input label="Đơn vị" placeholder="ml" {...register('unit')} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Ngày mua" type="date" {...register('purchaseDate')} />
                        <Input label="Hạn sử dụng" type="date" {...register('expiryDate')} />
                    </div>

                    {watch('expiryDate') && (
                        <div className="flex flex-col gap-1.5">
                            <label className={DS.label}>Nhắc trước (ngày)</label>
                            <input type="range" min={1} max={30}
                                value={watch('notifyBeforeDays') ?? 7}
                                onChange={e => setValue('notifyBeforeDays', parseInt(e.target.value))}
                                className="w-full" />
                            <div className="flex justify-between text-xs text-text-muted">
                                <span>1 ngày</span>
                                <span className="font-semibold text-primary-600">
                                    Nhắc trước {watch('notifyBeforeDays') ?? 7} ngày
                                </span>
                                <span>30 ngày</span>
                            </div>
                        </div>
                    )}

                    <Input label="Ghi chú" placeholder="Dùng sáng tối, 2 lần/ngày..."
                        {...register('notes')} />

                    <div className="flex gap-3 mt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Hủy</Button>
                        <Button type="submit"
                            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                            className="flex-1">
                            {isEdit ? 'Cập nhật' : 'Thêm'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}