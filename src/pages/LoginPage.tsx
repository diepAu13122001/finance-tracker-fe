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

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email không được để trống')
        .email('Email không hợp lệ'),
    password: z
        .string()
        .min(1, 'Mật khẩu không được để trống')
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
})

type LoginFormData = z.infer<typeof loginSchema>

// ─── Component ────────────────────────────────────────────────────────────────

const LoginPage = () => {
    const navigate = useNavigate()
    const setAuth = useAuthStore(s => s.setAuth)
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = async (data: LoginFormData) => {
        setServerError(null)
        try {
            const response = await authService.login(data)
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
            const message = error.response?.data?.message ?? 'Đăng nhập thất bại, vui lòng thử lại'
            setServerError(message)
        }
    }

    return (
        <div className="min-h-screen bg-surface-muted flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className={`${DS.heading1} mb-2`}>💰 Finance Tracker</h1>
                    <p className={DS.muted}>Đăng nhập để tiếp tục</p>
                </div>

                {/* Form card */}
                <div className={`${DS.card} flex flex-col gap-5`}>

                    <h2 className={DS.heading2}>Đăng nhập</h2>

                    {/* Server error */}
                    {serverError && (
                        <div className="bg-danger-50 border border-danger-500 rounded-lg px-4 py-3">
                            <p className="text-sm text-danger-600">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

                        <Input
                            label="Email"
                            type="email"
                            placeholder="ban@email.com"
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        {/*
                         * 👇 SỬA: Dùng PasswordInput thay Input type="password"
                         * → Có nút mắt để bật/tắt hiển thị mật khẩu
                         * → Giúp user kiểm tra trước khi submit, tránh nhập sai
                         */}
                        <PasswordInput
                            label="Mật khẩu"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register('password')}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            loading={isSubmitting}
                            className="w-full mt-2"
                        >
                            Đăng nhập
                        </Button>

                    </form>

                    {/* Link sang register */}
                    <p className={`${DS.muted} text-center`}>
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="text-primary-600 hover:underline font-medium">
                            Đăng ký miễn phí
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    )
}

export default LoginPage