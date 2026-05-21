# Finance Tracker — Frontend

React app quản lý tài chính cá nhân với hệ thống
plan gating (Free/Plus/Premium).

[![CI](https://github.com/diepau1312/finance-tracker-fe/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/diepau1312/finance-tracker-fe/actions)

**Live App:** https://finance-tracker-fe-rho.vercel.app

---

## Tech Stack & Lý Do Chọn

| Công nghệ             | Vai trò           | Tại sao chọn                                   |
| --------------------- | ----------------- | ---------------------------------------------- |
| React 18 + TypeScript | UI                | Type safety, IDE support                       |
| TanStack Query        | Server state      | Auto cache, invalidation, loading/error states |
| Zustand               | Client state      | Đơn giản hơn Redux, built-in persist           |
| React Hook Form + Zod | Form + validation | Ít re-render, type-safe schema                 |
| TailwindCSS           | Styling           | Utility-first, không đặt tên class             |
| Recharts              | Charts            | Declarative API, custom tooltip                |
| Vite                  | Build tool        | HMR nhanh, build nhanh                         |

---

## Kiến Trúc Quan Trọng

### Plan Gating — 2 Layer

```tsx
// Layer 1: Backend (@RequiresPlan AOP)
// Layer 2: Frontend — 2 patterns:

// Pattern A: PlanGate component (hide UI)
<PlanGate requires="PLUS">
  <CategorySelector /> // không render nếu Free
</PlanGate>;

// Pattern B: usePlan hook (conditional logic)
const { isPlus } = usePlan();
if (!isPlus) return <UpgradePrompt />;
// Chỉ fetch API nếu Plus — tránh 403 → redirect loop
```

### AI Insights — Lazy Load Pattern (Ngày 97)

```tsx
// Pattern: Không auto-fetch → tốn quota Gemini key
// User bấm "Phân tích" → mới gọi API

// Thành phần:
// - aiService.analyzeSpending(year, month)
//   gửi POST /api/ai/analyze-spending
//   backend tự lấy summary + categories
// - AIInsightsCard: loading skeleton, warnings, insights
// - Reset khi year/month thay đổi
```

### Cache Invalidation Strategy

```typescript
// Sau mỗi transaction mutation: invalidate TẤT CẢ related queries
const invalidateAll = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["chart"] });
  queryClient.invalidateQueries({ queryKey: ["categories"] });
  queryClient.invalidateQueries({ queryKey: ["goals"] });
};

// Sau execute recurring (ngày 99): invalidate cả recurring lẫn transactions
queryClient.invalidateQueries({ queryKey: ["recurring"] });
queryClient.invalidateQueries({ queryKey: ["transactions"] });
```

### Recurring Transactions — Template Pattern (Ngày 99)

```
User tạo template → hệ thống lưu vào recurring_transactions
Khi muốn ghi ngay → bấm "Ghi ngay" → execute() API
  → BE tạo transaction thực + advance nextExecutionDate
  → FE invalidate cả recurring (cập nhật ngày tiếp theo) và transactions (hiện giao dịch mới)

Components:
  RecurringCard       — hiển thị 1 recurring với actions
  RecurringFormModal  — tạo/sửa, React Hook Form + Zod validation
  RecurringPage       — danh sách active/inactive + plan gate
```

---

## Cấu Trúc Thư Mục

```
src/
├── components/
│   ├── ai/           AIInsightsCard                     (ngày 97)
│   ├── recurring/    RecurringCard, RecurringFormModal  (ngày 99)
│   ├── shared/       Button, Input, Card, PlanGate, UpgradePrompt...
│   ├── layout/       AppLayout, Sidebar, TopBar, BottomNav
│   ├── transactions/ TransactionList, Modal, FilterTabs, Item
│   ├── dashboard/    SummaryCards, TopGoalsWidget, TopSpendingWidget
│   ├── charts/       DailyBarChart, MonthlyTrendChart, CategoryPieChart
│   ├── categories/   CategoryCard, CategorySelector, CategoryFormModal
│   └── wallets/      WalletCard, WalletFormModal, WalletSelector
├── pages/
│   Dashboard, ExpensesPage, AnalyticsPage (+ AI Insights),
│   CategoriesPage, WalletsPage, RecurringPage (ngày 99),
│   SettingsPage, PricingPage, LoginPage, RegisterPage,
│   PaymentSuccessPage, PaymentCancelPage
├── hooks/
│   useTransactions, useCategories, useWallets,
│   useRecurring (ngày 99), useCharts, usePlan
├── services/
│   transactionService, categoryService, walletService,
│   recurringService (ngày 99), aiService (ngày 96-97),
│   chartService, exportService, paymentService
├── types/
│   transaction.ts, category.ts, wallet.ts,
│   recurring.ts (ngày 99), plans.ts
└── utils/
    format.ts, errorUtils.ts
```

---

## Features V1 → V2.3

| Feature                        | Free   | Plus              | Ngày   |
| ------------------------------ | ------ | ----------------- | ------ |
| Transactions CRUD              | 50/th  | Không giới hạn | V1     |
| Summary dashboard              | ✅      | ✅                | V1     |
| Biểu đồ cơ bản              | ✅      | ✅                | V1     |
| Wallet management              | 5 ví   | Không giới hạn | V2.3   |
| Transfer giữa ví             | ✅      | ✅                | V2.3   |
| Export Excel                   | ✅      | ✅                | V2.3   |
| Categories 2-level             | ❌      | ✅                | V2.1   |
| Category budget + rollover     | ✅      | ✅                | V2.1   |
| Pie chart theo category        | ❌      | ✅                | V2.1   |
| Financial Goals                | ❌      | ✅                | V2.2   |
| AI parse transaction (Gemini)  | ❌      | ✅                | ngày 96|
| **AI spending analysis**       | ❌      | ✅                | **97** |
| **Recurring Transactions**     | ❌      | ✅                | **99** |
| PayOS Payment                  | ❌      | ✅                | ngày 94|

---

## Setup Local

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8080
npm run dev
# App: http://localhost:5173
```

---

## Tests

```bash
npm run test:run

# Test files:
# format.test.ts          — 12 cases
# usePlan.test.ts         — 10 cases
# PlanGate.test.tsx       —  8 cases
# aiService.test.ts       —  5 cases  (ngày 101)
# useRecurring.test.ts    —  4 cases  (ngày 101)
```

---

## Responsive Design

```
Desktop (≥768px): Sidebar navigation
Mobile  (<768px): Bottom nav (5 items: Home, Nguồn tiền, Analytics⭐, Goals, AI)
                  Hidden pages (Categories, Settings, Expenses, Recurring):
                  → Accessible từ Dashboard quick nav
                  → Back button ← Home trên mobile header
```

---

## 👨‍💻 Tác Giả

**Diệp Âu**
[GitHub](https://github.com/diepau13122001) ·
[Email](mailto:diepau1312@gmail.com)
