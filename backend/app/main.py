from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .database import initialize_database, load_sales_data
from .services import (
    alert_summary,
    business_insights,
    dashboard_summary,
    data_quality_report,
    forecast_payload,
    inventory_recommendations,
    options,
    scenario_simulation,
    upload_dataset,
)


app = FastAPI(title="FMCG Demand Forecasting & Inventory Optimizer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    initialize_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/options")
def get_options() -> dict[str, object]:
    return options(load_sales_data())


@app.get("/api/dashboard")
def get_dashboard() -> dict[str, object]:
    return dashboard_summary(load_sales_data())


@app.get("/api/forecast")
def get_forecast(product_id: str, store_id: str) -> dict[str, object]:
    try:
        return forecast_payload(load_sales_data(), product_id, store_id)
    except (IndexError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/inventory")
def get_inventory() -> list[dict[str, object]]:
    return inventory_recommendations(load_sales_data())


@app.get("/api/insights")
def get_insights() -> dict[str, object]:
    return business_insights(load_sales_data())


@app.get("/api/data-quality")
def get_data_quality() -> dict[str, object]:
    return data_quality_report(load_sales_data())


@app.post("/api/upload/{dataset_type}")
async def upload_file(dataset_type: str, file: UploadFile = File(...)) -> dict[str, object]:
    if dataset_type not in {"sales", "inventory", "promotions", "products"}:
        raise HTTPException(status_code=400, detail="Unsupported dataset type.")
    try:
        return upload_dataset(await file.read(), file.filename or "uploaded_file.csv", dataset_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/scenario")
def get_scenario(
    product_id: str,
    store_id: str,
    discount: float = 20,
    temperature: float = 30,
    holiday: bool = False,
    promotion: bool = True,
) -> dict[str, object]:
    try:
        return scenario_simulation(load_sales_data(), product_id, store_id, discount, temperature, holiday, promotion)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/alerts")
def get_alerts() -> dict[str, object]:
    return alert_summary(load_sales_data())
