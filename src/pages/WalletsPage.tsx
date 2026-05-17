import { useState } from 'react'
import { Plus, Wallet, CreditCard, Archive } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { DS } from '@/lib/design-system'
import { WalletCard } from '@/components/wallets/WalletCard'
import { WalletFormModal } from '@/components/wallets/WalletFormModal'
import { WalletTransactionsDrawer } from '@/components/wallets/WalletTransactionsDrawer'
import { animations } from '@/lib/animations'
import { useWallets, useWalletCount } from '@/hooks/useWallets'
import type { WalletResponse, WalletType } from '@/types/wallet'
import { Skeleton } from '@/components/shared/Skeleton'
import { formatVND } from '@/utils/format'
import { usePlan } from '@/hooks/usePlan'
import { useNavigate } from 'react-router-dom'

type WalletTab = 'NORMAL' | 'DEBT' | 'CLOSED'

const FREE_WALLET_LIMIT = 5

const WalletsPage = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WalletResponse | null>(null)
  const [activeTab, setActiveTab] = useState<WalletTab>('NORMAL')
  const [defaultType, setDefaultType] = useState<WalletType>('NORMAL')
  const [drawerWallet, setDrawerWallet] = useState<WalletResponse | null>(null)

  const { isFree, isPlus } = usePlan()
  const navigate = useNavigate()

  // Free user cũng có thể xem ví (và ví mặc định "Tiền mặt" được tạo khi đăng ký)
  const { data: allWallets, isLoading } = useWallets(true) // enable cho cả free user
  const { data: walletCount } = useWalletCount()

  const activeWallets = allWallets?.filter(w => w.status === 'ACTIVE') ?? []
  const closedWallets = allWallets?.filter(w => w.status === 'CANCELLED') ?? []
  const normalWallets = activeWallets.filter(w => w.type === 'NORMAL')
  const debtWallets = activeWallets.filter(w => w.type === 'DEBT')

  const totalBalance = normalWallets.reduce((s, w) => s + w.balance, 0)
  const totalDebt = debtWallets.reduce((s, w) => s + w.currentAmount, 0)
  const netWorth = totalBalance - totalDebt

  const totalWalletCount = walletCount?.total ?? (allWallets?.length ?? 0)
  const isAtFreeLimit = isFree && totalWalletCount >= FREE_WALLET_LIMIT

  const openCreate = (type: WalletType) => {
    if (isAtFreeLimit) {
      navigate('/pricing')
      return
    }
    setEditing(null)
    setDefaultType(type)
    setModalOpen(true)
  }
  const openEdit = (w: WalletResponse) => { setEditing(w); setModalOpen(true) }
  const openDrawer = (w: WalletResponse) => setDrawerWallet(w)

  const TABS = [
    { key: 'NORMAL' as WalletTab, label: 'Tài khoản', icon: Wallet, count: normalWallets.length },
    { key: 'DEBT' as WalletTab, label: 'Khoản nợ', icon: CreditCard, count: debtWallets.length },
    { key: 'CLOSED' as WalletTab, label: 'Đã đóng', icon: Archive, count: closedWallets.length },
  ]

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">

      <div className={`flex items-center justify-between ${animations.fadeInUp}`}>
        <div>
          <h1 className={DS.heading1}>Nguồn tiền</h1>
          <p className={DS.muted}>Quản lý ví và khoản nợ của bạn</p>
        </div>
        {!isFree && (
          <div className="hidden md:block">
            <Button leftIcon={<Plus size={16} />} onClick={() => openCreate(activeTab === 'CLOSED' ? 'NORMAL' : activeTab)}>
              Thêm mới
            </Button>
          </div>
        )}
      </div>

      {/* Free user: hiển thị giới hạn ví */}
      {isFree && (
        <div className={`
                    px-4 py-3 rounded-xl border
                    ${isAtFreeLimit
            ? 'bg-danger-50 border-danger-200'
            : 'bg-amber-50 border-amber-200'
          }
                `}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {isAtFreeLimit
                  ? `🚫 Đã đạt giới hạn ${FREE_WALLET_LIMIT} nguồn tiền`
                  : `⚠ ${totalWalletCount}/${FREE_WALLET_LIMIT} nguồn tiền`
                }
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {isAtFreeLimit
                  ? 'Nâng cấp Plus để tạo không giới hạn'
                  : 'Gói miễn phí giới hạn 5 nguồn tiền (kể cả đã đóng)'
                }
              </p>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className={DS.btnPrimary}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Nâng cấp
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isAtFreeLimit ? 'bg-danger-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min((totalWalletCount / FREE_WALLET_LIMIT) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary — chỉ hiện nếu có ví */}
      {!isLoading && activeWallets.length > 0 && (
        <div className={DS.card}>
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-surface-border">
            <div>
              <div className="text-xs text-text-muted mb-1">Tổng số dư</div>
              <div className={`text-base font-bold ${totalBalance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {formatVND(Math.abs(totalBalance))}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Dư nợ</div>
              <div className="text-base font-bold text-danger-600">{formatVND(totalDebt)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Tài sản ròng</div>
              <div className={`text-base font-bold ${netWorth >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {netWorth < 0 ? '−' : ''}{formatVND(Math.abs(netWorth))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-muted rounded-xl">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-surface-border text-text-muted'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}

      {/* Tab: Tài khoản */}
      {activeTab === 'NORMAL' && !isLoading && (
        normalWallets.length === 0
          ? <EmptyState
            title="Chưa có tài khoản nào"
            desc="Tạo ví tiền mặt, ngân hàng, ví điện tử..."
            onAdd={() => openCreate('NORMAL')}
            locked={isAtFreeLimit}
          />
          : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {normalWallets.map(w => (
              <WalletCard
                key={w.id}
                wallet={w}
                onEdit={() => openEdit(w)}
                onClick={() => openDrawer(w)}
              />
            ))}
          </div>
      )}

      {/* Tab: Khoản nợ */}
      {activeTab === 'DEBT' && !isLoading && (
        debtWallets.length === 0
          ? <EmptyState
            title="Chưa có khoản nợ nào"
            desc="Theo dõi thẻ tín dụng và khoản trả góp..."
            onAdd={() => openCreate('DEBT')}
            locked={isAtFreeLimit}
          />
          : <div className="flex flex-col gap-3">
            {debtWallets.map(w => (
              <WalletCard
                key={w.id}
                wallet={w}
                onEdit={() => openEdit(w)}
                onClick={() => openDrawer(w)}
              />
            ))}
          </div>
      )}

      {/* Tab: Đã đóng */}
      {activeTab === 'CLOSED' && !isLoading && (
        closedWallets.length === 0
          ? (
            <div className={`${DS.card} text-center py-10`}>
              <Archive size={32} className="mx-auto text-text-muted mb-3" />
              <p className={DS.heading3}>Không có ví nào đã đóng</p>
              <p className={`${DS.muted} mt-2`}>Ví đóng vẫn giữ lịch sử giao dịch cũ</p>
            </div>
          )
          : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <Archive size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">
                  Ví đóng vẫn giữ lịch sử. Nhấn vào để xem giao dịch cũ.
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {closedWallets.map(w => (
                  <WalletCard
                    key={w.id}
                    wallet={w}
                    onEdit={() => { }} // không cho edit ví đã đóng
                    onClick={() => openDrawer(w)}
                  />
                ))}
              </div>
            </div>
          )
      )}

      {/* FAB mobile — chỉ hiện ở tab NORMAL và DEBT, không bị lock */}
      {activeTab !== 'CLOSED' && !isAtFreeLimit && (
        <button
          onClick={() => openCreate(activeTab)}
          className="fixed bottom-20 right-4 z-40 md:hidden w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg hover:bg-primary-600 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      )}

      <WalletFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingWallet={editing}
        defaultType={defaultType}
      />

      <WalletTransactionsDrawer
        wallet={drawerWallet}
        onClose={() => setDrawerWallet(null)}
      />
    </div>
  )
}

const EmptyState = ({
  title, desc, onAdd, locked,
}: { title: string; desc: string; onAdd: () => void; locked?: boolean }) => (
  <div className={`${DS.card} text-center py-10`}>
    <p className={DS.heading3}>{title}</p>
    <p className={`${DS.muted} mt-2 mb-4`}>{desc}</p>
    {locked ? (
      <p className="text-xs text-amber-600">Đã đạt giới hạn — nâng cấp để thêm mới</p>
    ) : (
      <Button leftIcon={<Plus size={16} />} onClick={onAdd}>Tạo mới</Button>
    )}
  </div>
)

export default WalletsPage