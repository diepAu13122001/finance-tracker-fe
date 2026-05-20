import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { DS } from '@/lib/design-system'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

const PaymentSuccessPage = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const queryClient = useQueryClient()
    const setAuth = useAuthStore(s => s.setAuth)
    const user = useAuthStore(s => s.user)
    const token = useAuthStore(s => s.token)

    // Khi user quay lại từ PayOS, refetch profile để cập nhật planId
    // Webhook PayOS đã activate sub → backend đã có plan mới → cần refresh JWT
    useEffect(() => {
        const refreshProfile = async () => {
            try {
                const { data } = await api.get('/api/users/me')
                if (user && token) {
                    // Cập nhật planId trong store ngay → UI thay đổi không cần reload
                    setAuth({ ...user, planId: data.planId }, token)
                }
                queryClient.invalidateQueries()
            } catch (e) {
                console.error('Failed to refresh profile', e)
            }
        }
        refreshProfile()
    }, [])

    return (
        <div className="min-h-screen bg-surface-muted flex items-center justify-center p-4">
            <div className={`${DS.card} max-w-md w-full text-center flex flex-col gap-4 items-center`}>
                <CheckCircle2 size={64} className="text-success-500" />
                <h1 className={DS.heading1}>Thanh toán thành công! 🎉</h1>
                <p className={DS.muted}>
                    Mã giao dịch: <strong>{searchParams.get('orderCode')}</strong>
                </p>
                <p className={DS.body}>
                    Tài khoản của bạn đã được nâng cấp. Tận hưởng các tính năng mới!
                </p>
                <Button onClick={() => navigate('/')} className="w-full">
                    Về trang chính
                </Button>
            </div>
        </div>
    )
}

export default PaymentSuccessPage