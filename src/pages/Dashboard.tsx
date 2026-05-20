import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DS } from '@/lib/design-system'
import { Button } from '@/components/shared/Button'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { TransactionList } from '@/components/transactions/TransactionList'
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal'
import { CreditAlertBanner } from '@/components/dashboard/CreditAlertBanner'
import { Plus, Tag, Settings, ArrowLeftRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { animations } from '@/lib/animations'
import { WalletSummaryWidget } from '@/components/dashboard/WalletSummaryWidget'
import { TopSpendingWidget } from '@/components/dashboard/TopSpendingWidget'

const Dashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const user = useAuthStore(s => s.user)
    const navigate = useNavigate()

    return (
        <div className="relative max-w-2xl mx-auto p-6 flex flex-col gap-6">

            {/* Header */}
            <div className={`flex items-center justify-between ${animations.fadeInUp}`}>
                <div>
                    <h1 className={DS.heading1}>
                        Xin chào, {user?.firstName} 👋
                    </h1>
                    <p className={DS.muted}>Đây là tổng quan tài chính của bạn</p>
                </div>
                <div className="hidden md:block">
                    <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
                        Thêm giao dịch
                    </Button>
                </div>
            </div>

            {/* Quick nav — mobile only */}
            <div className="flex gap-2 md:hidden">
                <button
                    onClick={() => navigate('/expenses')}
                    className="flex-1 flex items-center justify-center gap-2 bg-surface border border-surface-border rounded-xl py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                >
                    <ArrowLeftRight size={15} /> Giao dịch
                </button>
                <button
                    onClick={() => navigate('/categories')}
                    className="flex-1 flex items-center justify-center gap-2 bg-surface border border-surface-border rounded-xl py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                >
                    <Tag size={15} /> Danh mục
                </button>
                <button
                    onClick={() => navigate('/settings')}
                    className="flex-1 flex items-center justify-center gap-2 bg-surface border border-surface-border rounded-xl py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                >
                    <Settings size={15} /> Cài đặt
                </button>
            </div>

            {/* ⚠️ Cảnh báo thẻ tín dụng > 50% — chỉ hiện khi có */}
            <CreditAlertBanner />

            {/* Summary cards */}
            <SummaryCards />

            {/* Wallet summary widget */}
            <WalletSummaryWidget />

            {/* top spending categories */}
            <TopSpendingWidget />

            {/* Recent transactions */}
            <div className={`flex flex-col gap-3 ${animations.fadeIn}`}>
                <h2 className={DS.heading2}>Giao dịch gần đây</h2>
                <TransactionList />
            </div>

            {/* FAB mobile */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-20 right-4 z-40 md:hidden w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-200 hover:bg-primary-600 active:scale-95 transition-all duration-150"
                aria-label="Thêm giao dịch"
            >
                <Plus size={24} />
            </button>

            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
        </div>
    )
}

export default Dashboard