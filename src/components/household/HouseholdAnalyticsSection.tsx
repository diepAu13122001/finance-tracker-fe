import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { DS } from "@/lib/design-system";
import { ChartSkeleton } from "@/components/shared/Skeleton";
import { NoDataChartEmptyState } from "@/components/shared/EmptyState";
import { useHouseholdAnalytics } from "@/hooks/useHousehold";
import { formatShortVND, formatVND } from "@/utils/format";
import { ITEM_CATEGORY_CONFIG, type ItemCategory } from "@/types/household";

// Thứ tự các lớp chồng lên nhau trong cột (stacked)
const categoryOrder: ItemCategory[] = ["SKINCARE", "HOUSECARE", "FOOD", "CLOTHES", "OTHER"];

export const HouseholdAnalyticsSection = () => {
  const { data, isLoading } = useHouseholdAnalytics();

  if (isLoading) return <ChartSkeleton />;
  if (!data || data.breakdown.length === 0) {
    return <div className={DS.card}><NoDataChartEmptyState /></div>;
  }

  // BE trả về dạng "phẳng": mỗi dòng = (tháng, category, tiền).
  // Recharts cần dạng "rộng": mỗi tháng 1 object, mỗi category là 1 key.
  // -> Gom các dòng cùng tháng lại thành 1 object: { month, SKINCARE, FOOD, ... }
  const chartData = Object.values(
    data.breakdown.reduce<Record<string, Record<string, number | string>>>(
      (acc, row) => {
        acc[row.month] ??= { month: row.month };
        acc[row.month][row.category] =
          Number(acc[row.month][row.category] ?? 0) + row.totalSpent;
        return acc;
      },
      {},
    ),
  );

  const changeText =
    data.percentageChange === null
      ? "chưa có dữ liệu tháng trước để so sánh"
      : `${data.percentageChange >= 0 ? "+" : ""}${data.percentageChange.toFixed(1)}% so với tháng trước`;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className={DS.heading2}>Đồ dùng gia đình</h2>
        <p className={DS.muted}>
          Tháng này bạn đã mua đồ dùng {formatVND(data.currentMonthTotal)} ({changeText})
        </p>
      </div>

      <div className={DS.card}>
        <h3 className={`${DS.heading3} mb-1`}>Chi tiêu đồ dùng theo tháng</h3>
        <p className="text-xs text-text-muted mb-4">
          Tách theo skincare, nhà cửa, thực phẩm, quần áo và khác
        </p>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatShortVND} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              formatter={(value, name) => [
                formatVND(Number(value)),
                ITEM_CATEGORY_CONFIG[name as ItemCategory]?.label ?? name,
              ]}
              labelClassName="text-text-primary font-semibold"
            />
            {/* Cùng stackId="household" -> các Bar chồng lên nhau thành 1 cột */}
            {categoryOrder.map((category) => (
              <Bar
                key={category}
                dataKey={category}
                stackId="household"
                fill={ITEM_CATEGORY_CONFIG[category].color}
                radius={category === "OTHER" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};