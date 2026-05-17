import {
    ComposedChart, Bar, Line,
    XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
    ReferenceLine,
} from 'recharts'
import { DS } from '@/lib/design-system'
import { useDailyChart } from '@/hooks/useCharts'
import { formatShortVND, formatVND } from '@/utils/format'
import { ChartSkeleton } from '@/components/shared/Skeleton'
import { NoDataChartEmptyState } from '@/components/shared/EmptyState'

/**
 * Tính số dư tích lũy (cumulative balance) cho mỗi ngày.
 * Tương tự đường "Gross Profit %" trong ảnh mẫu — chạy qua bars.
 * balance[i] = balance[i-1] + income[i] - expense[i]
 */
function withCumulativeBalance(data: { income: number; expense: number }[]) {
    let acc = 0
    return data.map(d => {
        acc += d.income - d.expense
        return { ...d, netBalance: acc }
    })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const income = payload.find((p: any) => p.dataKey === 'income')?.value ?? 0
    const expense = payload.find((p: any) => p.dataKey === 'expense')?.value ?? 0
    const net = payload.find((p: any) => p.dataKey === 'netBalance')?.value ?? 0

    return (
        <div className={`${DS.card} !p-3 min-w-52 shadow-lg`}>
            <p className={`${DS.label} mb-3`}>{label}</p>
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-success-500" />
                        <span className="text-xs text-text-muted">Thu nhập</span>
                    </div>
                    <span className="text-sm font-semibold text-success-600">+{formatVND(income)}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-danger-500" />
                        <span className="text-xs text-text-muted">Chi tiêu</span>
                    </div>
                    <span className="text-sm font-semibold text-danger-600">-{formatVND(expense)}</span>
                </div>
                <div className="border-t border-surface-border pt-1.5 mt-0.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                        <span className="text-xs text-text-muted">Số dư lũy kế</span>
                    </div>
                    <span className={`text-sm font-bold ${net >= 0 ? 'text-primary-600' : 'text-danger-600'}`}>
                        {net >= 0 ? '+' : ''}{formatVND(net)}
                    </span>
                </div>
            </div>
        </div>
    )
}

interface DailyBarChartProps {
    year?: number
    month?: number
    startMonth?: number
    endMonth?: number
}

export const DailyBarChart = ({ year, month, startMonth, endMonth }: DailyBarChartProps) => {
    const { data: rawData, isLoading } = useDailyChart({ year, month, startMonth, endMonth })

    if (isLoading) return <ChartSkeleton />
    if (!rawData || rawData.length === 0) {
        return <div className={DS.card}><NoDataChartEmptyState /></div>
    }

    const data = withCumulativeBalance(rawData)
    const netValues = data.map(d => d.netBalance)
    const pad = Math.max(1, Math.max(...netValues.map(Math.abs))) * 0.25

    return (
        <div className={DS.card}>
            <h3 className={`${DS.heading3} mb-1`}>Thu chi theo ngày</h3>
            <p className="text-xs text-text-muted mb-4">
                Cột: thu nhập / chi tiêu từng ngày &nbsp;·&nbsp;
                <span className="text-primary-600 font-medium">Đường: số dư tích lũy</span>
            </p>

            {/**
             * ComposedChart: kết hợp Bar + Line trong cùng 1 SVG.
             *
             * Hai trục Y:
             * - yAxisId="left"  → Bars (income/expense, đơn vị VND)
             * - yAxisId="right" → Line (netBalance, scale riêng để không bị bar che)
             *
             * Kỹ thuật này giống hình mẫu: bars + line trên 2 scale khác nhau.
             */}
            <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%" barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                    <XAxis
                        dataKey="date"
                        tickFormatter={v => v.split('-')[2]}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false} tickLine={false}
                    />

                    {/* Trục trái — bars */}
                    <YAxis
                        yAxisId="left"
                        tickFormatter={formatShortVND}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false} tickLine={false} width={44}
                    />

                    {/* Trục phải — đường số dư */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={formatShortVND}
                        tick={{ fontSize: 11, fill: '#6366f1' }}
                        axisLine={false} tickLine={false} width={44}
                        domain={[Math.min(...netValues) - pad, Math.max(...netValues) + pad]}
                    />

                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />

                    <Legend
                        formatter={v =>
                            v === 'income' ? 'Thu nhập'
                                : v === 'expense' ? 'Chi tiêu'
                                    : 'Số dư lũy kế'
                        }
                        wrapperStyle={{ fontSize: 12 }}
                    />

                    <ReferenceLine yAxisId="right" y={0} stroke="#6366f1" strokeOpacity={0.3} strokeDasharray="4 4" />

                    <Bar yAxisId="left" dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    <Bar yAxisId="left" dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={24} />

                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="netBalance"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}