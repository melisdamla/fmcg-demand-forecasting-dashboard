import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Database, TrendingUp } from "lucide-react";
import KpiCard from "../components/KpiCard";
import Loading from "../components/Loading";
import Panel from "../components/Panel";
import { fetchJson } from "../services/api";

type AlertPayload = {
  stockout_risk_count: number;
  overstock_risk_count: number;
  demand_spike_count: number;
  data_quality_score: number;
  alerts: { type: string; severity: string; title: string; detail: string }[];
};

const severityClass: Record<string, string> = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-emerald-50 text-emerald-700"
};

export default function Alerts() {
  const [data, setData] = useState<AlertPayload | null>(null);

  useEffect(() => {
    fetchJson<AlertPayload>("/api/alerts").then(setData);
  }, []);

  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Stockout alerts" value={data.stockout_risk_count.toString()} detail="Products needing reorder" icon={AlertTriangle} tone="coral" />
        <KpiCard label="Overstock alerts" value={data.overstock_risk_count.toString()} detail="Inventory holding risk" icon={Bell} tone="amber" />
        <KpiCard label="Demand spikes" value={data.demand_spike_count.toString()} detail="Unusual recent sales" icon={TrendingUp} tone="blue" />
        <KpiCard label="Data quality" value={`${data.data_quality_score}/100`} detail="Upload and modeling readiness" icon={Database} />
      </div>

      <Panel title="Operational Alert List">
        <div className="space-y-3">
          {data.alerts.map((alert, index) => (
            <div key={`${alert.title}-${index}`} className="flex flex-col justify-between gap-3 rounded-lg border border-line p-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold text-ink">{alert.title}</p>
                <p className="mt-1 text-sm text-muted">{alert.detail}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-muted">{alert.type}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityClass[alert.severity] ?? severityClass.Low}`}>{alert.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
