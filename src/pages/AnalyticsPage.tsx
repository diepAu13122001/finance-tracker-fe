import { useState } from 'react'
import { DS } from '@/lib/design-system'
import { DailyBarChart } from '@/components/charts/DailyBarChart'
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { AIInsightsCard } from '@/components/ai/AIInsightsCard'
import { PlanGate } from '@/components/shared/PlanGate'
import { useCategoryChart } from '@/hooks/useCharts'
import { usePlan } from '@/hooks/usePlan'
import { UpgradePrompt } from '@/components/shared'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))
const QUARTERS = [
    { value: 1, label: 'Quý 1 (T1–T3)', startMonth: 1, endMonth: 3 },
    { value: 2, label: 'Quý 2 (T4–T6)', startMonth: 4, endMonth: 6 },
    { value: 3, label: 'Quý 3 (T7–T9)', startMonth: 7, endMonth: 9 },
    { value: 4, label: 'Quý 4 (T10–T12)', startMonth: 10, endMonth: 12 },
]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

type DailyFilterMode = 'month' | 'quarter'
type PieFilterMode = 'month' | 'quarter' | 'year'

const AnalyticsPage = () => {

    const { isPlus } = usePlan()

    if (!isPlus) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div>
                    <h1 className={DS.heading1}>Phân tích</h1>
                    <p className={DS.muted}>Xu hướng thu chi của bạn</p>
                </div>
                <div className="mt-6"><UpgradePrompt requiredPlan="PLUS" layout="card" /></div>
            </div>
        )
    }

    const now = new Date()

    // ── Daily chart filters ──────────────────────────────────────────────────
    const [dailyMode, setDailyMode] = useState<DailyFilterMode>('month')
    const [dailyYear, setDailyYear] = useState(now.getFullYear())
    const [dailyMonth, setDailyMonth] = useState(now.getMonth() + 1)
    const [dailyQuarter, setDailyQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3))

    // ── Monthly trend filters ────────────────────────────────────────────────
    const [trendYear, setTrendYear] = useState(now.getFullYear())

    // ── Pie chart filters ────────────────────────────────────────────────────
    const [pieMode, setPieMode] = useState<PieFilterMode>('month')
    const [pieYear, setPieYear] = useState(now.getFullYear())
    const [pieMonth, setPieMonth] = useState(now.getMonth() + 1)
    const [pieQuarter, setPieQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3))
    const [pieType, setPieType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')

    // ── AI Insights filters ──────────────────────────────────────────────────
    const [aiYear, setAiYear] = useState(now.getFullYear())
    const [aiMonth, setAiMonth] = useState(now.getMonth() + 1)

    const pieCategoryParams = (() => {
        const base = { type: pieType, year: pieYear } as const
        if (pieMode === 'month') return { ...base, month: pieMonth }
        if (pieMode === 'quarter') {
            const q = QUARTERS.find(q => q.value === pieQuarter)!
            return { ...base, startMonth: q.startMonth, endMonth: q.endMonth }
        }
        return base
    })()

    const { data: categoryChartData, isLoading: isLoadingPie } =
        useCategoryChart(pieCategoryParams)

    const quarterToMonths = (q: number) => ({
        startMonth: (q - 1) * 3 + 1,
        endMonth: q * 3,
    })

    const dailyChartParams = dailyMode === 'month'
        ? { year: dailyYear, month: dailyMonth }
        : { year: dailyYear, ...quarterToMonths(dailyQuarter) }

    return (
        <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">

            <div>
                <h1 className={DS.heading1}>Phân tích</h1>
                <p className={DS.muted}>Xu hướng thu chi của bạn</p>
            </div>

            {/* ── Chart 1: Daily ──────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
                <div>
                    <h2 className={DS.heading2}>Thu chi theo ngày</h2>
                    <p className={DS.muted}>So sánh thu và chi từng ngày</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex p-1 bg-surface-muted rounded-lg">
                        {([{ key: 'month', label: 'Theo tháng' }, { key: 'quarter', label: 'Theo quý' }] as { key: DailyFilterMode; label: string }[]).map(tab => (
                            <button key={tab.key} onClick={() => setDailyMode(tab.key)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${dailyMode === tab.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <select value={dailyYear} onChange={e => setDailyYear(Number(e.target.value))} className={`${DS.inputBase} w-24`}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {dailyMode === 'month' && (
                        <select value={dailyMonth} onChange={e => setDailyMonth(Number(e.target.value))} className={`${DS.inputBase} w-28`}>
                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    )}
                    {dailyMode === 'quarter' && (
                        <select value={dailyQuarter} onChange={e => setDailyQuarter(Number(e.target.value))} className={`${DS.inputBase} w-40`}>
                            {QUARTERS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                        </select>
                    )}
                </div>
                <DailyBarChart {...dailyChartParams} />
            </div>

            {/* ── Chart 2: Monthly trend ──────────────────────────────── */}
            <div className="flex flex-col gap-3">
                <div>
                    <h2 className={DS.heading2}>Xu hướng theo tháng</h2>
                    <p className={DS.muted}>Tổng thu chi mỗi tháng trong năm</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={DS.label}>Năm:</span>
                    <select value={trendYear} onChange={e => setTrendYear(Number(e.target.value))} className={`${DS.inputBase} w-24`}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <MonthlyTrendChart year={trendYear} />
            </div>

            {/* ── Chart 3: Pie chart ──────────────────────────────────── */}
            <div className="flex flex-col gap-3">
                <div>
                    <h2 className={DS.heading2}>Phân bổ theo danh mục</h2>
                    <p className={DS.muted}>Chi tiết từng danh mục</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex p-1 bg-surface-muted rounded-lg">
                        {([{ key: 'EXPENSE', label: 'Chi tiêu' }, { key: 'INCOME', label: 'Thu nhập' }] as { key: 'EXPENSE' | 'INCOME'; label: string }[]).map(tab => (
                            <button key={tab.key} onClick={() => setPieType(tab.key)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pieType === tab.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex p-1 bg-surface-muted rounded-lg">
                        {([{ key: 'month', label: 'Tháng' }, { key: 'quarter', label: 'Quý' }, { key: 'year', label: 'Năm' }] as { key: PieFilterMode; label: string }[]).map(tab => (
                            <button key={tab.key} onClick={() => setPieMode(tab.key)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pieMode === tab.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <select value={pieYear} onChange={e => setPieYear(Number(e.target.value))} className={`${DS.inputBase} w-24`}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {pieMode === 'month' && (
                        <select value={pieMonth} onChange={e => setPieMonth(Number(e.target.value))} className={`${DS.inputBase} w-28`}>
                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    )}
                    {pieMode === 'quarter' && (
                        <select value={pieQuarter} onChange={e => setPieQuarter(Number(e.target.value))} className={`${DS.inputBase} w-40`}>
                            {QUARTERS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                        </select>
                    )}
                </div>
                <CategoryPieChart
                    data={categoryChartData ?? []}
                    title={pieType === 'EXPENSE' ? 'Phân bổ chi tiêu theo danh mục' : 'Phân bổ thu nhập theo danh mục'}
                    isLoading={isLoadingPie}
                />
            </div>

            {/* ── AI Insights ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
                <div>
                    <h2 className={DS.heading2}>AI Insights</h2>
                    <p className={DS.muted}>Phân tích chi tiêu bằng Gemini AI</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={DS.label}>Tháng:</span>
                    <select value={aiMonth} onChange={e => { setAiMonth(Number(e.target.value)) }} className={`${DS.inputBase} w-28`}>
                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={aiYear} onChange={e => { setAiYear(Number(e.target.value)) }} className={`${DS.inputBase} w-24`}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <AIInsightsCard year={aiYear} month={aiMonth} />
            </div>

        </div>
    )
}

export default AnalyticsPage
