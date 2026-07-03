import { useEffect, useState } from "react";
import { Boxes, Percent, Thermometer, TrendingUp } from "lucide-react";
import KpiCard from "../components/KpiCard";
import Loading from "../components/Loading";
import Panel from "../components/Panel";
import { fetchJson, Options } from "../services/api";

type Scenario = {
  product_name: string;
  store_city: string;
  expected_demand: number;
  expected_uplift: number;
  recommended_stock: number;
  reorder_quantity: number;
  stockout_risk: string;
  reason_codes: { driver: string; impact: number }[];
};

export default function Simulator() {
  const [options, setOptions] = useState<Options | null>(null);
  const [productId, setProductId] = useState("P002");
  const [storeId, setStoreId] = useState("S005");
  const [discount, setDiscount] = useState(20);
  const [temperature, setTemperature] = useState(30);
  const [holiday, setHoliday] = useState(true);
  const [promotion, setPromotion] = useState(true);
  const [scenario, setScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    fetchJson<Options>("/api/options").then((value) => {
      setOptions(value);
      setProductId(value.products[1]?.product_id ?? value.products[0].product_id);
      setStoreId(value.stores[0]?.store_id ?? value.stores[0].store_id);
    });
  }, []);

  useEffect(() => {
    if (!productId || !storeId) return;
    const query = new URLSearchParams({ product_id: productId, store_id: storeId, discount: String(discount), temperature: String(temperature), holiday: String(holiday), promotion: String(promotion) });
    fetchJson<Scenario>(`/api/scenario?${query}`).then(setScenario);
  }, [productId, storeId, discount, temperature, holiday, promotion]);

  if (!options || !scenario) return <Loading />;

  return (
    <div className="space-y-6">
      <Panel title="What-if Simulator">
        <div className="grid gap-4 lg:grid-cols-3">
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={productId} onChange={(event) => setProductId(event.target.value)}>
            {options.products.map((product) => <option key={product.product_id} value={product.product_id}>{product.product_name}</option>)}
          </select>
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={storeId} onChange={(event) => setStoreId(event.target.value)}>
            {options.stores.map((store) => <option key={store.store_id} value={store.store_id}>{store.store_city}</option>)}
          </select>
          <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
            <span className="text-sm text-muted">Discount</span>
            <input className="w-full accent-teal" type="range" min="0" max="40" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
            <span className="w-10 text-sm font-semibold">{discount}%</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
            <span className="text-sm text-muted">Temp</span>
            <input className="w-full accent-teal" type="range" min="0" max="40" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} />
            <span className="w-12 text-sm font-semibold">{temperature}C</span>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm"><input type="checkbox" checked={promotion} onChange={(event) => setPromotion(event.target.checked)} /> Promotion</label>
          <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm"><input type="checkbox" checked={holiday} onChange={(event) => setHoliday(event.target.checked)} /> Holiday</label>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Expected demand" value={scenario.expected_demand.toLocaleString()} detail="Next 30 days" icon={TrendingUp} />
        <KpiCard label="Expected uplift" value={`${scenario.expected_uplift}%`} detail="Versus baseline" icon={Percent} tone="blue" />
        <KpiCard label="Recommended stock" value={scenario.recommended_stock.toLocaleString()} detail="Demand plus safety stock" icon={Boxes} tone="amber" />
        <KpiCard label="Stockout risk" value={scenario.stockout_risk} detail="Scenario risk level" icon={Thermometer} tone="coral" />
      </div>

      <Panel title="Reason Codes">
        <div className="grid gap-3 md:grid-cols-3">
          {scenario.reason_codes.map((reason) => (
            <div key={reason.driver} className="rounded-lg border border-line bg-white p-4">
              <p className="text-sm font-semibold">{reason.driver}</p>
              <p className="mt-2 text-2xl font-semibold text-teal">+{reason.impact}%</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
