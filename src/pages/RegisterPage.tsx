import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { PasswordInput } from '@/components/shared/PasswordInput'  // 👈 THÊM
import { DS } from '@/lib/design-system'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

// ─── Validation Schema ────────────────────────────────────────────────────────

const registerSchema = z
    .object({
        firstName: z
            .string()
            .min(1, 'Tên không được để trống')
            .max(50, 'Tên tối đa 50 ký tự'),

        lastName: z.string().optional(),

        email: z
            .string()
            .min(1, 'Email không được để trống')
            .email('Email không hợp lệ'),

        password: z
            .string()
            .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
            .max(100, 'Mật khẩu tối đa 100 ký tự'),

        confirmPassword: z
            .string()
            .min(1, 'Vui lòng xác nhận mật khẩu'),
    })
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            message: 'Mật khẩu xác nhận không khớp',
            path: ['confirmPassword'],
        }
    )

type RegisterFormData = z.infer<typeof registerSchema>

// ─── Component ────────────────────────────────────────────────────────────────

const RegisterPage = () => {
    const navigate = useNavigate()
    const setAuth = useAuthStore(s => s.setAuth)
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (data: RegisterFormData) => {
        setServerError(null)
        try {
            const response = await authService.register({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
            })
            setAuth(
                {
                    email: response.email,
                    firstName: response.firstName,
                    planId: response.planId,
                },
                response.token
            )
            navigate('/')
        } catch (error: any) {
            const message = error.response?.data?.message ?? 'Đăng ký thất bại, vui lòng thử lại'
            setServerError(message)
        }
    }

    return (
        <div className="min-h-screen bg-surface-muted flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className={`${DS.heading1} mb-2`}>💰 Finance Tracker</h1>
                    <p className={DS.muted}>Tạo tài khoản miễn phí</p>
                </div>

                <div className={`${DS.card} flex flex-col gap-5`}>

                    <h2 className={DS.heading2}>Đăng ký</h2>

                    {/* Server error */}
                    {serverError && (
                        <div className="bg-danger-50 border border-danger-500 rounded-lg px-4 py-3">
                            <p className="text-sm text-danger-600">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

                        {/* Họ tên — 2 cột */}
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Tên"
                                placeholder="Diệp"
                                error={errors.firstName?.message}
                                required
                                {...register('firstName')}
                            />
                            <Input
                                label="Họ"
                                placeholder="Nguyễn"
                                error={errors.lastName?.message}
                                {...register('lastName')}
                            />
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            placeholder="ban@email.com"
                            error={errors.email?.message}
                            required
                            {...register('email')}
                        />

                        {/*
                         * 👇 SỬA: Dùng PasswordInput cho cả 2 ô password
                         * 
                         * Lý do 2 ô password dùng state toggle riêng biệt:
                         * → Khi user bật xem password chính, confirmPassword vẫn ẩn
                         * → User có thể so sánh dễ hơn: bật 1 ô rồi đối chiếu bằng mắt
                         * → Đây là UX tốt hơn là dùng 1 toggle chung cho cả 2
                         */}
                        <PasswordInput
                            label="Mật khẩu"
                            placeholder="••••••••"
                            helperText="Ít nhất 8 ký tự"
                            error={errors.password?.message}
                            required
                            {...register('password')}
                        />

                        <PasswordInput
                            label="Xác nhận mật khẩu"
                            placeholder="••••••••"
                            error={errors.confirmPassword?.message}
                            required
                            {...register('confirmPassword')}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            loading={isSubmitting}
                            className="w-full mt-2"
                        >
                            Tạo tài khoản
                        </Button>

                    </form>

                    {/* Thông tin gói Free */}
                    <div className="bg-surface-muted rounded-lg p-3 text-center">
                        <p className="text-xs text-text-muted">
                            🆓 Tài khoản mới được tạo với gói <strong>Miễn phí</strong> —
                            tối đa 50 giao dịch/tháng
                        </p>
                    </div>

                    <p className={`${DS.muted} text-center`}>
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-primary-600 hover:underline font-medium">
                            Đăng nhập
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    )
}

export default RegisterPage