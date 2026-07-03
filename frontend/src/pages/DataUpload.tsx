import { useEffect, useState } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";
import KpiCard from "../components/KpiCard";
import Loading from "../components/Loading";
import Panel from "../components/Panel";
import { fetchJson } from "../services/api";

type Quality = {
  data_quality_score: number;
  missing_value_rate: number;
  duplicate_rows: number;
  outlier_days_detected: number;
  products_ready_for_forecasting: number;
  missing_required_columns: string[];
};

type UploadResponse = {
  dataset_type: string;
  filename: string;
  rows_received: number;
  rows_after_cleaning: number;
  columns: string[];
  required_columns: string[];
  suggested_mappings: { source_column: string; required_field: string }[];
  quality_report: Quality;
  preview: Record<string, string | number | null>[];
  pipeline_status: string[];
};

export default function DataUpload() {
  const [quality, setQuality] = useState<Quality | null>(null);
  const [datasetType, setDatasetType] = useState("sales");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchJson<Quality>("/api/data-quality").then(setQuality);
  }, []);

  async function upload() {
    if (!file) return;
    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`http://localhost:8000/api/upload/${datasetType}`, { method: "POST", body });
    setResult(await response.json());
    setBusy(false);
  }

  if (!quality) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Data Quality Score" value={`${quality.data_quality_score}/100`} detail="Synthetic demo dataset" icon={CheckCircle2} />
        <KpiCard label="Missing Values" value={`${quality.missing_value_rate}%`} detail="Across required fields" icon={CheckCircle2} tone="blue" />
        <KpiCard label="Duplicate Rows" value={quality.duplicate_rows.toString()} detail="Detected before modeling" icon={CheckCircle2} tone="amber" />
        <KpiCard label="Forecast Ready" value={`${quality.products_ready_for_forecasting}%`} detail="Products with usable schema" icon={CheckCircle2} tone="coral" />
      </div>

      <Panel title="Company File Upload">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <select className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" value={datasetType} onChange={(event) => setDatasetType(event.target.value)}>
              <option value="sales">Sales file</option>
              <option value="inventory">Inventory file</option>
              <option value="products">Product catalog</option>
              <option value="promotions">Promotion calendar</option>
            </select>
            <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <UploadCloud className="text-teal" />
              <span className="mt-2 text-sm font-medium text-ink">{file ? file.name : "Choose CSV or Excel file"}</span>
              <span className="mt-1 text-xs text-muted">Upload, validate, clean, preview, save, and retrain-ready pipeline</span>
              <input className="hidden" type="file" accept=".csv,.xlsx,.xls" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </label>
            <button className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!file || busy} onClick={upload}>
              {busy ? "Uploading..." : "Run Upload Pipeline"}
            </button>
          </div>

          <div className="rounded-lg border border-line p-4">
            <p className="text-sm font-semibold text-ink">Column Mapping Tool</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <span>Your column</span>
              <span>Required field</span>
            </div>
            {(result?.suggested_mappings.length ? result.suggested_mappings : [
              { source_column: "InvoiceDate", required_field: "date" },
              { source_column: "SKU", required_field: "product_id" },
              { source_column: "Location", required_field: "store_id" },
              { source_column: "Quantity", required_field: "units_sold" },
              { source_column: "UnitPrice", required_field: "price" }
            ]).map((row) => (
              <div key={`${row.source_column}-${row.required_field}`} className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span>{row.source_column}</span>
                <span className="font-medium text-teal">{row.required_field}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {result && (
        <Panel title="Upload Result">
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard label="Rows received" value={result.rows_received.toLocaleString()} detail={result.filename} icon={CheckCircle2} />
            <KpiCard label="Rows after cleaning" value={result.rows_after_cleaning.toLocaleString()} detail="Duplicates removed" icon={CheckCircle2} tone="blue" />
            <KpiCard label="Quality score" value={`${result.quality_report.data_quality_score}/100`} detail="Uploaded file" icon={CheckCircle2} tone="amber" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {result.pipeline_status.map((step) => <span key={step} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{step}</span>)}
          </div>
        </Panel>
      )}
    </div>
  );
}
