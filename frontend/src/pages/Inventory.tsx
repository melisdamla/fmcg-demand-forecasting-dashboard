import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import Panel from "../components/Panel";
import { fetchJson } from "../services/api";

type InventoryRow = {
  product_name: string;
  category: string;
  store_city: string;
  current_stock: number;
  forecasted_30_day_demand: number;
  safety_stock: number;
  recommended_stock: number;
  reorder_quantity: number;
  days_until_stockout: number | null;
  estimated_lost_revenue_avoided: number;
  estimated_overstock_cost: number;
  reorder_by_days: number;
  status: "Healthy Stock" | "Stockout Risk" | "Overstock Risk";
};

const statusClass = {
  "Healthy Stock": "bg-emerald-50 text-emerald-700",
  "Stockout Risk": "bg-red-50 text-red-700",
  "Overstock Risk": "bg-amber-50 text-amber-700"
};

export default function Inventory() {
  const [rows, setRows] = useState<InventoryRow[] | null>(null);
  const [status, setStatus] = useState("All");

  useEffect(() => {
    fetchJson<InventoryRow[]>("/api/inventory").then(setRows);
  }, []);

  if (!rows) return <Loading />;

  const filtered = rows.filter((row) => status === "All" || row.status === status).slice(0, 80);

  return (
    <Panel
      title="Inventory Optimization"
      action={
        <select className="rounded-lg border border-line bg-white px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          {["All", "Stockout Risk", "Healthy Stock", "Overstock Risk"].map((item) => <option key={item}>{item}</option>)}
        </select>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Store</th>
              <th className="px-3 py-3">Current</th>
              <th className="px-3 py-3">30 Day Demand</th>
              <th className="px-3 py-3">Safety</th>
              <th className="px-3 py-3">Recommended</th>
              <th className="px-3 py-3">Reorder</th>
              <th className="px-3 py-3">Cover</th>
              <th className="px-3 py-3">Lost Rev. Avoided</th>
              <th className="px-3 py-3">Overstock Cost</th>
              <th className="px-3 py-3">Reorder By</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((row, index) => (
              <tr key={`${row.product_name}-${row.store_city}-${index}`} className="hover:bg-slate-50">
                <td className="px-3 py-3">
                  <p className="font-medium text-ink">{row.product_name}</p>
                  <p className="text-xs text-muted">{row.category}</p>
                </td>
                <td className="px-3 py-3 text-muted">{row.store_city}</td>
                <td className="px-3 py-3">{row.current_stock}</td>
                <td className="px-3 py-3">{row.forecasted_30_day_demand}</td>
                <td className="px-3 py-3">{row.safety_stock}</td>
                <td className="px-3 py-3 font-medium">{row.recommended_stock}</td>
                <td className="px-3 py-3 font-semibold text-teal">{row.reorder_quantity}</td>
                <td className="px-3 py-3">{row.days_until_stockout ? `${row.days_until_stockout.toFixed(1)}d` : "n/a"}</td>
                <td className="px-3 py-3">${row.estimated_lost_revenue_avoided}</td>
                <td className="px-3 py-3">${row.estimated_overstock_cost}</td>
                <td className="px-3 py-3">{row.reorder_by_days}d</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[row.status]}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
