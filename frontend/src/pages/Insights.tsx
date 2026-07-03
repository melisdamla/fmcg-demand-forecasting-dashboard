import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Loading from "../components/Loading";
import Panel from "../components/Panel";
import { fetchJson } from "../services/api";

type InsightsData = {
  promotion_impact: { product_name: string; promotion_lift: number }[];
  category_comparison: { category: string; units_sold: number; revenue: number }[];
  weather_effect: { category: string; temperature_bucket: string; units_sold: number }[];
  holiday_effect: { category: string; holiday_lift: number }[];
  promotion_roi: { product_name: string; discount_percentage: number; sales_uplift: number; promotion_roi: number; estimated_margin_loss: number }[];
  written_insights: string[];
};

export default function Insights() {
  const [data, setData] = useState<InsightsData | null>(null);

  useEffect(() => {
    fetchJson<InsightsData>("/api/insights").then(setData);
  }, []);

  if (!data) return <Loading />;

  const frozenWeather = data.weather_effect.filter((row) => row.category === "Frozen");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Promotion Lift by Product">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.promotion_impact.slice(0, 10)} layout="vertical" margin={{ left: 34 }}>
                <CartesianGrid stroke="#e5e9f2" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#657086" }} />
                <YAxis type="category" dataKey="product_name" width={150} tick={{ fill: "#657086", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="promotion_lift" fill="#e76f51" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Category Comparison">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.category_comparison}>
                <CartesianGrid stroke="#e5e9f2" vertical={false} />
                <XAxis dataKey="category" tick={{ fill: "#657086" }} />
                <YAxis tick={{ fill: "#657086" }} />
                <Tooltip />
                <Bar dataKey="units_sold" fill="#0f766e" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Weather Effect on Ice Cream Demand">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={frozenWeather}>
                <CartesianGrid stroke="#e5e9f2" vertical={false} />
                <XAxis dataKey="temperature_bucket" tick={{ fill: "#657086" }} />
                <YAxis tick={{ fill: "#657086" }} />
                <Tooltip />
                <Line type="monotone" dataKey="units_sold" stroke="#38bdf8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Written Business Insights">
          <div className="space-y-3">
            {data.written_insights.map((insight) => (
              <div key={insight} className="rounded-lg border border-line bg-slate-50 p-4 text-sm leading-6 text-ink">
                {insight}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Holiday Demand Lift">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.holiday_effect}>
              <CartesianGrid stroke="#e5e9f2" vertical={false} />
              <XAxis dataKey="category" tick={{ fill: "#657086" }} />
              <YAxis tick={{ fill: "#657086" }} />
              <Tooltip />
              <Bar dataKey="holiday_lift" fill="#f59e0b" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Promotion ROI Analysis">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.promotion_roi}>
              <CartesianGrid stroke="#e5e9f2" vertical={false} />
              <XAxis dataKey="product_name" tick={{ fill: "#657086", fontSize: 10 }} />
              <YAxis tick={{ fill: "#657086" }} />
              <Tooltip />
              <Bar dataKey="promotion_roi" fill="#0f766e" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
