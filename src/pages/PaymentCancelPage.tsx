import { useNavigate, useSearchParams } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { DS } from '@/lib/design-system'

const PaymentCancelPage = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    return (
        <div className="min-h-screen bg-surface-muted flex items-center justify-center p-4">
            <div className={`${DS.card} max-w-md w-full text-center flex flex-col gap-4 items-center`}>
                <XCircle size={64} className="text-danger-500" />
                <h1 className={DS.heading1}>Thanh toán đã hủy</h1>
                <p className={DS.muted}>
                    Mã giao dịch: <strong>{searchParams.get('orderCode')}</strong>
                </p>
                <p className={DS.body}>
                    Bạn có thể thử lại bất cứ lúc nào. Tài khoản của bạn vẫn ở gói hiện tại.
                </p>
                <div className="flex gap-3 w-full">
                    <Button variant="ghost" onClick={() => navigate('/')} className="flex-1">
                        Về trang chính
                    </Button>
                    <Button onClick={() => navigate('/pricing')} className="flex-1">
                        Thử lại
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default PaymentCancelPage