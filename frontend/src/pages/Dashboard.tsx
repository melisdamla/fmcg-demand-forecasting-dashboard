import { useEffect, useState } from "react";
import { AlertTriangle, Boxes, DollarSign, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import KpiCard from "../components/KpiCard";
import Loading from "../components/Loading";
import Panel from "../components/Panel";
import { fetchJson } from "../services/api";

type DashboardData = {
  total_sales: number;
  total_revenue: number;
  forecasted_30_day_demand: number;
  stock_risk_score: number;
  top_selling_products: { product_name: string; units_sold: number; revenue: number }[];
  products_at_stockout_risk: RiskItem[];
  products_with_excess_inventory: RiskItem[];
  category_sales: { category: string; units_sold: number; revenue: number }[];
  sales_trend: { date: string; units_sold: number; revenue: number }[];
};

type RiskItem = {
  product_name: string;
  store_city: string;
  current_stock: number;
  days_until_stockout: number;
  forecast_30_day_demand?: number;
};

const fmt = new Intl.NumberFormat("en-US");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchJson<DashboardData>("/api/dashboard").then(setData);
  }, []);

  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total sales" value={fmt.format(data.total_sales)} detail="Units sold in latest 30 days" icon={DollarSign} tone="teal" />
        <KpiCard label="Forecasted demand" value={fmt.format(data.forecasted_30_day_demand)} detail="Projected next 30 days" icon={TrendingUp} tone="blue" />
        <KpiCard label="Stock risk score" value={`${data.stock_risk_score}/100`} detail="Weighted stockout and overstock exposure" icon={AlertTriangle} tone="amber" />
        <KpiCard label="Revenue" value={money.format(data.total_revenue)} detail="Net sales after discounts" icon={Boxes} tone="coral" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Sales Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sales_trend}>
                <CartesianGrid stroke="#e5e9f2" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#657086" }} minTickGap={28} />
                <YAxis tick={{ fill: "#657086" }} />
                <Tooltip />
                <Line type="monotone" dataKey="units_sold" stroke="#0f766e" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Top Selling Products">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_selling_products} layout="vertical" margin={{ left: 28 }}>
                <CartesianGrid stroke="#e5e9f2" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#657086" }} />
                <YAxis type="category" dataKey="product_name" width={132} tick={{ fill: "#657086", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="units_sold" fill="#0f766e" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Category Performance">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.category_sales}>
                <CartesianGrid stroke="#e5e9f2" vertical={false} />
                <XAxis dataKey="category" tick={{ fill: "#657086", fontSize: 11 }} />
                <YAxis tick={{ fill: "#657086" }} />
                <Tooltip />
                <Bar dataKey="units_sold" fill="#38bdf8" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <RiskList title="Products at Stockout Risk" items={data.products_at_stockout_risk} tone="text-coral" />
        <RiskList title="Products with Excess Inventory" items={data.products_with_excess_inventory} tone="text-amber" />
      </div>
    </div>
  );
}

function RiskList({ title, items, tone }: { title: string; items: RiskItem[]; tone: string }) {
  return (
    <Panel title={title}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${item.product_name}-${item.store_city}-${index}`} className="rounded-lg border border-line p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{item.product_name}</p>
                <p className="text-xs text-muted">{item.store_city}</p>
              </div>
              <p className={`text-sm font-semibold ${tone}`}>{fmt.format(item.current_stock)}</p>
            </div>
            <p className="mt-2 text-xs text-muted">
              {item.days_until_stockout ? `${item.days_until_stockout.toFixed(1)} days of cover` : "Demand cover unavailable"}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
