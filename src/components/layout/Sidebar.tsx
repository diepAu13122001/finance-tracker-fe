import { NavLink } from 'react-router-dom'
// import { DS } from '@/lib/design-system'
import { LockedBadge } from '@/components/shared/LockedBadge'
import { usePlan } from '@/hooks/usePlan'
import {
    LayoutDashboard,
    ArrowLeftRight,
    BarChart2,
    Target,
    Bot,
    ShoppingBag,
    Settings,
    Tag,
    type LucideIcon,
    Wallet,
} from 'lucide-react'

// ─── Nav item config ──────────────────────────────────────────────────────────

interface NavItem {
    label: string
    href: string
    icon: LucideIcon
    requiredPlan?: 'PLUS' | 'PREMIUM'
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Giao dịch', href: '/expenses', icon: ArrowLeftRight },
    { label: 'Danh mục', href: '/categories', icon: Tag, requiredPlan: 'PLUS' },
    { label: 'Phân tích', href: '/analytics', icon: BarChart2, requiredPlan: 'PLUS' },
    { label: 'Nguồn tiền', href: '/wallets', icon: Wallet },
    { label: 'AI Assistant', href: '/ai', icon: Bot, requiredPlan: 'PLUS' },
    { label: 'Đồ dùng', href: '/household', icon: ShoppingBag, requiredPlan: 'PREMIUM' },
    { label: 'Cài đặt', href: '/settings', icon: Settings },

]

// ─── Component ────────────────────────────────────────────────────────────────

export const Sidebar = () => {
    const { hasLevel } = usePlan()

    return (
        <aside className="w-56 bg-surface border-r border-surface-border flex flex-col py-4 shrink-0">
            <nav className="flex flex-col gap-1 px-2">
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon
                    const isLocked = item.requiredPlan
                        ? !hasLevel(item.requiredPlan)
                        : false

                    return (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            end={item.href === '/'}
                            className={({ isActive }) => `
                flex items-center justify-between px-3 py-2.5 rounded-lg
                text-sm font-medium transition-colors
                ${isActive
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                                }
              `}
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </div>

                            {/* Badge khóa nếu chưa đủ plan */}
                            {item.requiredPlan && isLocked && (
                                <LockedBadge requiredPlan={item.requiredPlan} />
                            )}
                        </NavLink>
                    )
                })}
            </nav>
        </aside>
    )
}