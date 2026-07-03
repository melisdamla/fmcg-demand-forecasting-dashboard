import { useEffect, useMemo, useState } from "react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import KpiCard from "../components/KpiCard";
import Loading from "../components/Loading";
import Panel from "../components/Panel";
import { fetchJson, Options } from "../services/api";
import { Activity, Gauge, Percent } from "lucide-react";

type ForecastPayload = {
  product: { id: string; name: string; category: string };
  store: { id: string; city: string };
  history: { date: string; units_sold: number; promotion: number; holiday: number; temperature: number }[];
  forecast: { date: string; forecast: number; lower: number; upper: number }[];
  metrics: { mae: number; rmse: number; mape: number };
  best_model: string;
  model_comparison: { model: string; mae: number; rmse: number; mape: number }[];
  feature_importance: { feature: string; importance: number }[];
};

export default function Forecasting() {
  const [options, setOptions] = useState<Options | null>(null);
  const [productId, setProductId] = useState("P002");
  const [storeId, setStoreId] = useState("S005");
  const [forecast, setForecast] = useState<ForecastPayload | null>(null);

  useEffect(() => {
    fetchJson<Options>("/api/options").then((value) => {
      setOptions(value);
      setProductId(value.products[1]?.product_id ?? value.products[0].product_id);
      setStoreId(value.stores[0]?.store_id ?? "S001");
    });
  }, []);

  useEffect(() => {
    if (productId && storeId) {
      setForecast(null);
      fetchJson<ForecastPayload>(`/api/forecast?product_id=${productId}&store_id=${storeId}`).then(setForecast);
    }
  }, [productId, storeId]);

  const combined = useMemo(() => {
    if (!forecast) return [];
    return [
      ...forecast.history.map((row) => ({ date: row.date, actual: row.units_sold })),
      ...forecast.forecast.map((row) => ({ ...row, interval: [row.lower, row.upper] }))
    ];
  }, [forecast]);

  if (!options) return <Loading />;

  return (
    <div className="space-y-6">
      <Panel
        title="Forecast Controls"
        action={
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="rounded-lg border border-line bg-white px-3 py-2 text-sm" value={productId} onChange={(event) => setProductId(event.target.value)}>
              {options.products.map((product) => (
                <option key={product.product_id} value={product.product_id}>{product.product_name}</option>
              ))}
            </select>
            <select className="rounded-lg border border-line bg-white px-3 py-2 text-sm" value={storeId} onChange={(event) => setStoreId(event.target.value)}>
              {options.stores.map((store) => (
                <option key={store.store_id} value={store.store_id}>{store.store_city} ({store.store_id})</option>
              ))}
            </select>
          </div>
        }
      >
        {!forecast ? (
          <Loading />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard label="MAE" value={forecast.metrics.mae.toString()} detail="Mean absolute error" icon={Activity} />
              <KpiCard label="RMSE" value={forecast.metrics.rmse.toString()} detail="Root mean squared error" icon={Gauge} tone="blue" />
              <KpiCard label="Best model" value={forecast.best_model} detail={`MAPE ${forecast.metrics.mape}%`} icon={Percent} tone="amber" />
            </div>
            <div className="h-[430px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combined}>
                  <CartesianGrid stroke="#e5e9f2" vertical={false} />
                  <XAxis dataKey="date" minTickGap={36} tick={{ fill: "#657086" }} />
                  <YAxis tick={{ fill: "#657086" }} />
                  <Tooltip />
                  <Area dataKey="interval" stroke="none" fill="#bae6fd" fillOpacity={0.55} />
                  <Line type="monotone" dataKey="actual" stroke="#172033" strokeWidth={2} dot={false} name="Historical sales" />
                  <Line type="monotone" dataKey="forecast" stroke="#0f766e" strokeWidth={2.5} dot={false} name="Forecast" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Panel>
      {forecast && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="AutoML Model Comparison">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecast.model_comparison}>
                  <CartesianGrid stroke="#e5e9f2" vertical={false} />
                  <XAxis dataKey="model" tick={{ fill: "#657086", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#657086" }} />
                  <Tooltip />
                  <Bar dataKey="mape" fill="#0f766e" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Explainable AI: Feature Importance">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecast.feature_importance.slice(0, 8)} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="#e5e9f2" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#657086" }} />
                  <YAxis type="category" dataKey="feature" width={128} tick={{ fill: "#657086", fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="importance" fill="#38bdf8" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
