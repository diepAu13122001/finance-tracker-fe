import { DS } from '@/lib/design-system'
import { usePlan } from '@/hooks/usePlan'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, Bell } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { notify, TOAST_MESSAGES } from '@/lib/toast'
import { useNotifications } from '@/hooks/useNotifications'

// ─── Plan badge màu theo gói ──────────────────────────────────────────────────

const PlanBadge = () => {
    const { isFree, isPremium } = usePlan()

    const config = isFree
        ? { label: 'Free', className: `${DS.badge} bg-surface-border text-text-muted` }
        : isPremium
            ? { label: '💎 Premium', className: `${DS.badge} ${DS.badgePremium}` }
            : { label: '⭐ Plus', className: `${DS.badge} ${DS.badgePrimary}` }

    return <span className={config.className}>{config.label}</span>
}



// ─── Component ────────────────────────────────────────────────────────────────

export const TopBar = () => {
    // Thêm hook trong TopBar component
    const { unreadCount, markAllRead } = useNotifications()
    const navigate = useNavigate()
    const user = useAuthStore(s => s.user)
    const queryClient = useQueryClient()
    const logout = useAuthStore(s => s.logout)


    const handleLogout = () => {
        logout(queryClient)
        notify.success(TOAST_MESSAGES.auth.loggedOut)
        navigate('/login')
    }

    return (
        <header className="h-14 bg-surface border-b border-surface-border flex items-center justify-between px-4 shrink-0">

            {/* Logo */}
            <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate('/')}
            >
                <span className="text-xl">💰</span>
                <span className={`${DS.heading3} hidden sm:block`}>Finance Tracker</span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                <PlanBadge />

                <span className={`${DS.muted} hidden sm:block`}>
                    {user?.firstName}
                </span>

                <button
                    onClick={markAllRead}
                    className="relative p-2 rounded-lg hover:bg-surface-muted text-text-muted transition-colors"
                >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white
            text-xs rounded-full flex items-center justify-center font-bold leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => navigate('/settings')}
                    className="p-2 rounded-lg hover:bg-surface-muted text-text-muted hover:text-text-primary transition-colors"
                >
                    <Settings size={18} />
                </button>

                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-surface-muted text-text-muted hover:text-danger-500 transition-colors"
                >
                    <LogOut size={18} />
                </button>
            </div>

        </header>
    )
}