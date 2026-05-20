import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import * as Icons from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { DS } from '@/lib/design-system'
import { animations } from '@/lib/animations'
import { useCategories } from '@/hooks/useCategories'
import {
    CATEGORY_ICONS,
    CATEGORY_COLORS,
    type CategoryResponse,

} from '@/types/category'
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories'
import { getErrorMessage } from '@/utils/errorUtils'
import { type TransactionType } from '@/types/transaction'
import { parseSmartVNDInput, formatVND } from '@/utils/format'

const toPascalCase = (str: string): string =>
    str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')

const categorySchema = z.object({
    name: z.string().min(1, 'Tên không được để trống').max(50, 'Tối đa 50 ký tự'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    monthlyBudget: z.string().optional(),
})


type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormModalProps {
    isOpen: boolean
    onClose: () => void
    editingCategory: CategoryResponse | null
    defaultType?: TransactionType
    presetParent?: CategoryResponse | null
}

export const CategoryFormModal = ({
    isOpen,
    onClose,
    editingCategory,
    defaultType = 'EXPENSE',
    presetParent = null,
}: CategoryFormModalProps) => {

    const isEditMode = editingCategory !== null

    const [selectedIcon, setSelectedIcon] = useState<string>('tag')
    const [selectedColor, setSelectedColor] = useState<string>('#82b01e')
    const [serverError, setServerError] = useState<string | null>(null)
    const [parentId, setParentId] = useState<string | null>(null)
    const createMutation = useCreateCategory()
    const updateMutation = useUpdateCategory()
    // Lấy danh sách root categories cùng type (để làm dropdown chọn parent)
    const { data: rootsTree } = useCategories(defaultType)
    // Chỉ lấy root từ tree (mỗi item có children)
    const availableParents = rootsTree ?? []

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: { type: defaultType },
    })

    // 🔄 SỬA: dùng watch để biết type hiện tại
    const selectedType = watch('type')

    useEffect(() => {
        if (!isOpen) return
        reset({
            name: editingCategory?.name ?? '',
            type: editingCategory?.type ?? defaultType,
            monthlyBudget: editingCategory?.monthlyBudget
                ? editingCategory.monthlyBudget.toLocaleString('vi-VN')
                : '',
        })
        setSelectedIcon(editingCategory?.icon ?? 'tag')
        setSelectedColor(editingCategory?.color ?? '#82b01e')
        // Init parent: edit mode → giữ parent cũ; create với presetParent
        setParentId(
            editingCategory?.parentCategoryId
            ?? presetParent?.id
            ?? null
        )
        setServerError(null)
    }, [isOpen, editingCategory, reset, defaultType, presetParent])

    const onSubmit = async (data: CategoryFormData) => {
        setServerError(null)
        const payload = {
            name: data.name.trim(),
            type: data.type,
            icon: selectedIcon,
            color: selectedColor,
            parentCategoryId: parentId,
            monthlyBudget: data.monthlyBudget && parseSmartVNDInput(data.monthlyBudget) > 0
                ? parseSmartVNDInput(data.monthlyBudget)
                : null,
        }
        try {
            if (isEditMode && editingCategory) {
                await updateMutation.mutateAsync({ id: editingCategory.id, request: payload })
            } else {
                await createMutation.mutateAsync(payload)
            }
            onClose()
        } catch (err: unknown) {
            setServerError(getErrorMessage(err, 'Có lỗi xảy ra'))
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className={`
                ${DS.card} w-full sm:max-w-md
                rounded-t-2xl sm:rounded-xl
                max-h-[90vh] overflow-y-auto
                ${animations.slideInBottom} sm:${animations.scaleIn}
            `}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className={DS.heading2}>
                        {isEditMode ? 'Sửa danh mục' : 'Thêm danh mục'}
                    </h2>
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

                    {/* 🔄 SỬA: Dùng button + setValue thay vì peer-checked (fix vấn đề 3) */}
                    <div>
                        <label className={DS.label}>Loại</label>
                        <input type="hidden" {...register('type')} />
                        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-muted rounded-lg mt-1">
                            {(['EXPENSE', 'INCOME'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setValue('type', type, { shouldValidate: true })}
                                    className={`
                                        py-2 rounded-md text-sm font-medium transition-all
                                        ${selectedType === type
                                            ? 'bg-white text-text-primary shadow-sm'
                                            : 'text-text-secondary hover:text-text-primary'
                                        }
                                    `}
                                >
                                    {type === 'INCOME' ? '↑ Thu nhập' : '↓ Chi tiêu'}
                                </button>
                            ))}
                        </div>
                        {errors.type && (
                            <p className="text-xs text-danger-600 mt-1">{errors.type.message}</p>
                        )}


                    </div>

                    {/* Parent selector — chỉ hiện khi không phải edit root, không phải edit category đang có con */}
                    {!editingCategory?.children?.length && (
                        <div>
                            <label className={DS.label}>Nhóm cha (tùy chọn)</label>
                            <select
                                value={parentId ?? ''}
                                onChange={e => setParentId(e.target.value || null)}
                                className={`${DS.inputBase} mt-1`}
                            >
                                <option value="">— Không có (đây là nhóm chính) —</option>
                                {availableParents.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-text-muted mt-1">
                                Chọn nhóm cha để tạo danh mục con. Bỏ trống để tạo nhóm chính.
                            </p>
                        </div>)}

                    <Input
                        label="Tên danh mục"
                        placeholder="Ăn uống, Lương, Đầu tư..."
                        error={errors.name?.message}
                        {...register('name')}
                    />

                    {selectedType === 'EXPENSE' && (
                        <div>
                            <Input
                                label="Ngân sách dự kiến/tháng (tùy chọn)"
                                type="text"
                                placeholder="2.000.000 hoặc bỏ trống"
                                helperText="Dư sẽ cộng dồn sang tháng sau, lố sẽ bị trừ. Để trống = không theo dõi."
                                {...register('monthlyBudget')}
                                onBlur={(e) => {
                                    const parsed = parseSmartVNDInput(e.target.value)
                                    if (parsed > 0) {
                                        setValue('monthlyBudget', parsed.toLocaleString('vi-VN'))
                                    }
                                }}
                            />
                            {watch('monthlyBudget') && parseSmartVNDInput(watch('monthlyBudget') ?? '') > 0 && (
                                <p className="text-xs text-text-muted mt-1">
                                    = {formatVND(parseSmartVNDInput(watch('monthlyBudget') ?? ''))}
                                </p>
                            )}
                        </div>
                    )}

                    {/* 🔄 SỬA: Icon picker — tối hơn khi chưa chọn (fix vấn đề 5) */}
                    <div>
                        <label className={DS.label}>Icon</label>
                        <div className="grid grid-cols-8 gap-2 mt-2">
                            {CATEGORY_ICONS.map(iconName => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const IconComponent = (Icons as any)[toPascalCase(iconName)] || Icons.Tag
                                const isSelected = iconName === selectedIcon
                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setSelectedIcon(iconName)}
                                        className="aspect-square rounded-lg flex items-center justify-center transition-all"
                                        style={isSelected ? {
                                            backgroundColor: selectedColor + '25',  // nhạt
                                            color: selectedColor,          // màu icon = màu danh mục
                                            outline: `2px solid ${selectedColor}`,
                                            outlineOffset: '2px',
                                        } : {
                                            backgroundColor: '#e5e7eb',
                                            color: '#374151',
                                        }}
                                    >
                                        <IconComponent size={18} />
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Color picker — giữ nguyên */}
                    <div>
                        <label className={DS.label}>Màu sắc</label>
                        <div className="grid grid-cols-10 gap-2 mt-2">
                            {CATEGORY_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`
                                        aspect-square rounded-full transition-transform
                                        ${color === selectedColor
                                            ? 'ring-2 ring-offset-2 ring-text-primary scale-110'
                                            : 'hover:scale-110'
                                        }
                                    `}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Chọn màu ${color}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                            className="flex-1"
                        >
                            {isEditMode ? 'Cập nhật' : 'Tạo danh mục'}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    )
}