import { NavLink } from 'react-router-dom'
import { usePlan } from '@/hooks/usePlan'
import {
    LayoutDashboard,
    ShoppingBag,
    BarChart2,
    Target,
    Bot,
    type LucideIcon,
    Wallet,
} from 'lucide-react'

interface BottomNavItem {
    label: string
    href: string
    icon: LucideIcon
    isFocus?: boolean            // center elevated button
    requiredPlan?: 'PLUS' | 'PREMIUM'
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
    { label: 'Home', href: '/', icon: LayoutDashboard },
    { label: 'Nguồn tiền', href: '/wallets', icon: Wallet},
    { label: 'Phân tích', href: '/analytics', icon: BarChart2, isFocus: true, requiredPlan: 'PLUS' },
    { label: 'Đồ dùng', href: '/household', icon: ShoppingBag, requiredPlan: 'PREMIUM' },
    { label: 'AI Chat', href: '/ai', icon: Bot, requiredPlan: 'PREMIUM' },
]

export const BottomNav = () => {
    const { hasLevel } = usePlan()

    return (
        <nav className="
            h-16 bg-surface border-t border-surface-border
            flex items-end pb-2 px-2 shrink-0
            safe-area-inset-bottom
        ">
            {BOTTOM_NAV_ITEMS.map(item => {
                const Icon = item.icon
                const isLocked = item.requiredPlan ? !hasLevel(item.requiredPlan) : false

                if (item.isFocus) {
                    // ── Center elevated FAB-style button ──────────────────────
                    return (
                        <div key={item.href} className="flex-1 flex justify-center items-end">
                            <NavLink
                                to={item.href}
                                className={({ isActive }) => `
                                    flex flex-col items-center gap-0.5 relative`}
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`
                                            w-14 h-14 rounded-2xl
                                            flex items-center justify-center
                                            shadow-lg transition-all duration-200
                                            ${isActive
                                                ? 'bg-primary-600 scale-105'
                                                : 'bg-primary-500 hover:bg-primary-600 active:scale-95'
                                            }
                                        `}>
                                            <Icon size={24} color="white" />
                                            {isLocked && (
                                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" />
                                            )}
                                        </div>
                                        <span className={`
                                            text-xs font-semibold
                                            ${isActive ? 'text-primary-600' : 'text-text-muted'}
                                        `}>
                                            {item.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        </div>
                    )
                }

                // ── Regular nav item ──────────────────────────────────────────
                return (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.href === '/'}
                        className={({ isActive }) => `
                            flex-1 flex flex-col items-center justify-end gap-0.5 pb-1
                            text-xs font-medium transition-colors relative
                            ${isActive ? 'text-primary-600' : 'text-text-muted hover:text-text-secondary'}
                        `}
                    >
                        <div className="relative">
                            <Icon size={22} />
                            {isLocked && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                            )}
                        </div>
                        <span>{item.label}</span>
                    </NavLink>
                )
            })}
        </nav>
    )
}