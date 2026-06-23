import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { DS } from '@/lib/design-system'
import { PrivateRoute } from '@/components/shared/PrivateRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { notify } from '@/lib/toast'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const PricingPage = lazy(() => import('@/pages/PricingPage'))
const DevKit = lazy(() => import('@/pages/DevKit'))
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const SettingPsage = lazy(() => import('@/pages/SettingsPage'))
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'))
const WalletsPage = lazy(() => import('@/pages/WalletsPage'))
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'))
const PaymentCancelPage = lazy(() => import('@/pages/PaymentCancelPage'))
const HouseholdPage = lazy(() => import('@/pages/HouseholdPage'))
const HouseholdItemDetailPage = lazy(() => import('@/pages/HouseholdItemDetailPage'))

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className={DS.heading1}>{title}</h1>
    <p className={DS.muted}>Trang này sẽ được xây dựng sớm.</p>
  </div>
)

/**
 * Hook theo dõi token expiry.
 *
 * Vấn đề #6: Sau một khoảng thời gian không focus vào tab, JWT hết hạn (15 phút)
 * nhưng PrivateRoute không re-check vì không re-render.
 *
 * Fix: check token mỗi 60s và khi window focus lại.
 * Nếu expired → logout + redirect → tránh tình trạng "app im lặng không hiển thị data".
 */
function useTokenExpiryWatcher() {
  const logout = useAuthStore(s => s.logout)
  const queryClient = useQueryClient()

  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = useAuthStore.getState().token
      if (!token) return // chưa đăng nhập → không cần check

      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const isExpired = payload.exp * 1000 < Date.now()

        if (isExpired) {
          // Token đã hết hạn → logout sạch
          logout(queryClient)
          notify.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          // Redirect về login
          window.location.href = '/login'
        }
      } catch {
        // Token corrupt → logout
        logout(queryClient)
        window.location.href = '/login'
      }
    }

    // Check ngay lúc mount
    checkTokenExpiry()

    // Check mỗi phút (phòng trường hợp tab active liên tục)
    const interval = setInterval(checkTokenExpiry, 60 * 1000)

    // Check khi user quay lại tab (document.visibilitychange + window.focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTokenExpiry()
      }
    }
    const handleFocus = () => checkTokenExpiry()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [logout, queryClient])
}

function App() {
  // Fix #6: Watch token expiry
  useTokenExpiryWatcher()

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            animation: 'toastEnter 0.3s ease forwards',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            <p className={DS.muted}>Đang tải...</p>
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Private routes — bọc trong AppLayout */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/wallets" element={<WalletsPage />} />
              <Route path="/ai" element={<PlaceholderPage title="🤖 AI Assistant" />} />
              <Route path="/household" element={<HouseholdPage />} />
              <Route path="/household/:id" element={<HouseholdItemDetailPage />} />
              <Route path="/settings" element={<SettingPsage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/cancel" element={<PaymentCancelPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />

          {import.meta.env.DEV && (
            <Route path="/dev" element={<DevKit />} />
          )}
        </Routes>
      </Suspense>
    </>
  )
}

export default App