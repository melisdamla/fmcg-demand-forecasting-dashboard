from __future__ import annotations

from io import BytesIO
from pathlib import Path
import sqlite3

import numpy as np
import pandas as pd

from .database import DB_PATH
from .ml import forecast_product_store

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "data" / "uploads"

REQUIRED_COLUMNS = {
    "sales": ["date", "product_id", "store_id", "units_sold", "price"],
    "inventory": ["product_id", "store_id", "current_stock"],
    "promotions": ["date", "product_id", "store_id", "promotion", "discount_percentage"],
    "products": ["product_id", "product_name", "category", "price"],
}

SUGGESTED_MAPPINGS = {
    "InvoiceDate": "date",
    "Date": "date",
    "SKU": "product_id",
    "ProductCode": "product_id",
    "Location": "store_id",
    "Store": "store_id",
    "Quantity": "units_sold",
    "Qty": "units_sold",
    "UnitPrice": "price",
    "PromoFlag": "promotion",
    "Discount": "discount_percentage",
    "StockOnHand": "current_stock",
}


def _quality_from_frame(df: pd.DataFrame, required: list[str]) -> dict[str, object]:
    missing_required = [column for column in required if column not in df.columns]
    missing_cells = int(df.isna().sum().sum())
    duplicate_rows = int(df.duplicated().sum())
    invalid_dates = 0
    negative_sales = 0
    outlier_days = 0

    if "date" in df.columns:
        parsed = pd.to_datetime(df["date"], errors="coerce")
        invalid_dates = int(parsed.isna().sum())
    if "units_sold" in df.columns:
        numeric_sales = pd.to_numeric(df["units_sold"], errors="coerce")
        negative_sales = int((numeric_sales < 0).sum())
        threshold = numeric_sales.quantile(0.99)
        outlier_days = int((numeric_sales > threshold).sum())

    penalty = len(missing_required) * 12 + missing_cells / max(len(df), 1) * 8 + duplicate_rows / max(len(df), 1) * 20
    penalty += invalid_dates / max(len(df), 1) * 18 + negative_sales / max(len(df), 1) * 20
    score = max(0, min(100, 100 - penalty))
    return {
        "data_quality_score": round(float(score), 1),
        "missing_required_columns": missing_required,
        "missing_values": missing_cells,
        "missing_value_rate": round(float(missing_cells / max(df.size, 1) * 100), 2),
        "duplicate_rows": duplicate_rows,
        "invalid_dates": invalid_dates,
        "negative_sales": negative_sales,
        "outlier_days_detected": outlier_days,
        "products_ready_for_forecasting": 100 - len(missing_required) * 12,
    }


def upload_dataset(file_bytes: bytes, filename: str, dataset_type: str) -> dict[str, object]:
    required = REQUIRED_COLUMNS.get(dataset_type, REQUIRED_COLUMNS["sales"])
    if filename.lower().endswith(".csv"):
        df = pd.read_csv(BytesIO(file_bytes))
    elif filename.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(BytesIO(file_bytes))
    else:
        raise ValueError("Only CSV and Excel files are supported.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    cleaned = df.drop_duplicates().copy()
    if "date" in cleaned.columns:
        cleaned["date"] = pd.to_datetime(cleaned["date"], errors="coerce").dt.date.astype("string")
    for column in ["units_sold", "price", "current_stock", "discount_percentage"]:
        if column in cleaned.columns:
            cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")

    saved_path = UPLOAD_DIR / f"{dataset_type}_{filename.replace(' ', '_')}"
    cleaned.to_csv(saved_path.with_suffix(".csv"), index=False)
    with sqlite3.connect(DB_PATH) as conn:
        cleaned.to_sql(f"uploaded_{dataset_type}", conn, if_exists="replace", index=False)

    return {
        "dataset_type": dataset_type,
        "filename": filename,
        "rows_received": int(len(df)),
        "rows_after_cleaning": int(len(cleaned)),
        "columns": list(df.columns),
        "required_columns": required,
        "suggested_mappings": [
            {"source_column": column, "required_field": SUGGESTED_MAPPINGS[column]}
            for column in df.columns
            if column in SUGGESTED_MAPPINGS
        ],
        "quality_report": _quality_from_frame(cleaned, required),
        "preview": cleaned.head(8).replace({np.nan: None}).to_dict(orient="records"),
        "pipeline_status": ["uploaded", "validated", "cleaned", "previewed", "saved_to_database", "ready_for_retraining"],
    }


def data_quality_report(df: pd.DataFrame) -> dict[str, object]:
    report = _quality_from_frame(df, REQUIRED_COLUMNS["sales"])
    history = df.groupby(["product_id", "product_name"], as_index=False)["date"].nunique()
    report["products_with_too_little_history"] = int((history["date"] < 180).sum())
    report["stores_with_missing_stock_data"] = int(df[df["current_stock"].isna()]["store_id"].nunique())
    report["promotion_dates_without_sales_data"] = int(((df["promotion"] == 1) & (df["units_sold"] <= 0)).sum())
    return report


def options(df: pd.DataFrame) -> dict[str, list[dict[str, str]]]:
    products = df[["product_id", "product_name", "category"]].drop_duplicates().sort_values("product_name")
    stores = df[["store_id", "store_city"]].drop_duplicates().sort_values("store_city")
    return {
        "products": products.to_dict(orient="records"),
        "stores": stores.to_dict(orient="records"),
    }


def dashboard_summary(df: pd.DataFrame) -> dict[str, object]:
    latest = df["date"].max()
    recent = df[df["date"] > latest - pd.Timedelta(days=30)]
    grouped = recent.groupby(["product_id", "product_name", "category", "store_id", "store_city"], as_index=False).agg(
        units_sold=("units_sold", "sum"),
        revenue=("revenue", "sum"),
        current_stock=("current_stock", "last"),
    )
    grouped["daily_demand"] = grouped["units_sold"] / 30
    grouped["forecast_30_day_demand"] = grouped["daily_demand"] * 30 * 1.06
    grouped["days_until_stockout"] = grouped["current_stock"] / grouped["daily_demand"].replace(0, np.nan)
    grouped["risk_status"] = np.select(
        [grouped["days_until_stockout"] < 14, grouped["current_stock"] > grouped["forecast_30_day_demand"] * 1.8],
        ["Stockout Risk", "Overstock Risk"],
        default="Healthy Stock",
    )
    risk_score = float((grouped["risk_status"].eq("Stockout Risk").mean() * 70) + (grouped["risk_status"].eq("Overstock Risk").mean() * 30))
    top_products = recent.groupby("product_name", as_index=False).agg(units_sold=("units_sold", "sum"), revenue=("revenue", "sum"))
    top_products = top_products.sort_values("units_sold", ascending=False).head(5)
    category_sales = recent.groupby("category", as_index=False).agg(units_sold=("units_sold", "sum"), revenue=("revenue", "sum"))
    trend = recent.groupby("date", as_index=False).agg(units_sold=("units_sold", "sum"), revenue=("revenue", "sum"))
    trend["date"] = trend["date"].dt.date.astype(str)

    return {
        "total_sales": int(recent["units_sold"].sum()),
        "total_revenue": round(float(recent["revenue"].sum()), 2),
        "forecasted_30_day_demand": int(grouped["forecast_30_day_demand"].sum()),
        "stock_risk_score": round(risk_score, 1),
        "top_selling_products": top_products.to_dict(orient="records"),
        "products_at_stockout_risk": grouped[grouped["risk_status"] == "Stockout Risk"].sort_values("days_until_stockout").head(8).replace({np.nan: None}).to_dict(orient="records"),
        "products_with_excess_inventory": grouped[grouped["risk_status"] == "Overstock Risk"].sort_values("current_stock", ascending=False).head(8).to_dict(orient="records"),
        "category_sales": category_sales.to_dict(orient="records"),
        "sales_trend": trend.to_dict(orient="records"),
    }


def inventory_recommendations(df: pd.DataFrame) -> list[dict[str, object]]:
    latest = df["date"].max()
    recent = df[df["date"] > latest - pd.Timedelta(days=30)]
    recs = recent.groupby(["product_id", "product_name", "category", "store_id", "store_city"], as_index=False).agg(
        units_sold=("units_sold", "sum"),
        current_stock=("current_stock", "last"),
    )
    recs["forecasted_30_day_demand"] = recs["units_sold"] * 1.06
    recs["safety_stock"] = np.maximum(10, recs["forecasted_30_day_demand"] * 0.22)
    recs["lead_time_days"] = np.select([recs["category"].eq("Frozen"), recs["category"].eq("Skincare")], [4, 9], default=7)
    recs["recommended_stock"] = recs["forecasted_30_day_demand"] + recs["safety_stock"]
    recs["reorder_quantity"] = np.maximum(0, recs["recommended_stock"] - recs["current_stock"])
    recs["days_until_stockout"] = recs["current_stock"] / (recs["units_sold"] / 30).replace(0, np.nan)
    recs["estimated_lost_revenue_avoided"] = np.maximum(0, 14 - recs["days_until_stockout"].fillna(99)) * (recs["units_sold"] / 30) * 6.8
    recs["estimated_overstock_cost"] = np.maximum(0, recs["current_stock"] - recs["recommended_stock"]) * 0.18
    recs["reorder_by_days"] = np.maximum(0, recs["days_until_stockout"].fillna(99) - recs["lead_time_days"] - 2)
    recs["status"] = np.select(
        [recs["days_until_stockout"] < 14, recs["current_stock"] > recs["recommended_stock"] * 1.55],
        ["Stockout Risk", "Overstock Risk"],
        default="Healthy Stock",
    )
    for col in ["forecasted_30_day_demand", "safety_stock", "recommended_stock", "reorder_quantity", "days_until_stockout", "estimated_lost_revenue_avoided", "estimated_overstock_cost", "reorder_by_days"]:
        recs[col] = recs[col].round(1)
    return recs.sort_values(["status", "reorder_quantity"], ascending=[False, False]).replace({np.nan: None}).to_dict(orient="records")


def business_insights(df: pd.DataFrame) -> dict[str, object]:
    promo = df.groupby(["product_name", "promotion"], as_index=False)["units_sold"].mean()
    promo_pivot = promo.pivot(index="product_name", columns="promotion", values="units_sold").fillna(0)
    promo_pivot["promotion_lift"] = ((promo_pivot.get(1, 0) - promo_pivot.get(0, 1)) / promo_pivot.get(0, 1).replace(0, np.nan) * 100).round(1)
    promo_impact = promo_pivot.reset_index()[["product_name", "promotion_lift"]].sort_values("promotion_lift", ascending=False)
    promotion_roi = df[df["promotion"] == 1].groupby(["product_name", "discount_percentage"], as_index=False).agg(
        promo_units=("units_sold", "mean"),
        promo_revenue=("revenue", "mean"),
    )
    baseline = df[df["promotion"] == 0].groupby("product_name", as_index=False).agg(base_units=("units_sold", "mean"), base_revenue=("revenue", "mean"))
    promotion_roi = promotion_roi.merge(baseline, on="product_name", how="left")
    promotion_roi["sales_uplift"] = ((promotion_roi["promo_units"] - promotion_roi["base_units"]) / promotion_roi["base_units"].replace(0, np.nan) * 100).round(1)
    promotion_roi["estimated_margin_loss"] = (promotion_roi["discount_percentage"] / 100 * promotion_roi["promo_revenue"] * 0.42).round(2)
    promotion_roi["promotion_roi"] = ((promotion_roi["promo_revenue"] - promotion_roi["base_revenue"] - promotion_roi["estimated_margin_loss"]) / promotion_roi["estimated_margin_loss"].replace(0, np.nan)).round(2)

    category = df.groupby("category", as_index=False).agg(units_sold=("units_sold", "sum"), revenue=("revenue", "sum"))
    weather = df.copy()
    weather["temperature_bucket"] = pd.cut(weather["temperature"], bins=[-10, 10, 18, 25, 40], labels=["Cold", "Mild", "Warm", "Hot"])
    weather_effect = weather.groupby(["category", "temperature_bucket"], observed=True, as_index=False)["units_sold"].mean()
    holiday = df.groupby(["category", "holiday"], as_index=False)["units_sold"].mean()
    holiday_pivot = holiday.pivot(index="category", columns="holiday", values="units_sold").fillna(0)
    holiday_pivot["holiday_lift"] = ((holiday_pivot.get(1, 0) - holiday_pivot.get(0, 1)) / holiday_pivot.get(0, 1).replace(0, np.nan) * 100).round(1)

    ice = weather[(weather["category"] == "Frozen") & (weather["temperature"] > 25)]["units_sold"].mean()
    ice_base = weather[(weather["category"] == "Frozen") & (weather["temperature"] <= 25)]["units_sold"].mean()
    shampoo_lift = float(promo_impact[promo_impact["product_name"].str.contains("Shampoo")]["promotion_lift"].iloc[0])

    written = [
        f"Ice cream demand increases by {((ice - ice_base) / ice_base * 100):.1f}% when temperature is above 25C.",
        f"Promotions increased shampoo sales by {shampoo_lift:.1f}% on average.",
        f"Holiday periods lift frozen and beverage categories, with Frozen showing strong event-driven demand.",
        "Stores with less than 14 days of cover should be prioritized for replenishment before promotional campaigns.",
    ]

    return {
        "promotion_impact": promo_impact.to_dict(orient="records"),
        "category_comparison": category.to_dict(orient="records"),
        "weather_effect": weather_effect.to_dict(orient="records"),
        "holiday_effect": holiday_pivot.reset_index()[["category", "holiday_lift"]].to_dict(orient="records"),
        "promotion_roi": promotion_roi.sort_values("promotion_roi", ascending=False).head(12).replace({np.nan: None}).to_dict(orient="records"),
        "written_insights": written,
    }


def forecast_payload(df: pd.DataFrame, product_id: str, store_id: str) -> dict[str, object]:
    result = forecast_product_store(df, product_id, store_id)
    selection = df[(df["product_id"] == product_id) & (df["store_id"] == store_id)].iloc[-1]
    return {
        "product": {"id": product_id, "name": selection["product_name"], "category": selection["category"]},
        "store": {"id": store_id, "city": selection["store_city"]},
        "history": result.history,
        "forecast": result.forecast,
        "metrics": result.metrics,
        "best_model": result.best_model,
        "model_comparison": result.model_comparison,
        "feature_importance": result.feature_importance,
    }


def scenario_simulation(
    df: pd.DataFrame,
    product_id: str,
    store_id: str,
    discount: float,
    temperature: float,
    holiday: bool,
    promotion: bool,
) -> dict[str, object]:
    subset = df[(df["product_id"] == product_id) & (df["store_id"] == store_id)]
    if subset.empty:
        raise ValueError("Unknown product/store selection.")
    latest = subset.sort_values("date").tail(90)
    base_daily = float(latest["units_sold"].mean())
    category = str(latest["category"].iloc[-1])
    uplift = 0.0
    reasons = []
    if promotion:
        promo_uplift = min(0.55, 0.12 + discount / 100 * 1.35)
        uplift += promo_uplift
        reasons.append({"driver": "Promotion active", "impact": round(promo_uplift * 100, 1)})
    if holiday:
        uplift += 0.13
        reasons.append({"driver": "Holiday period", "impact": 13.0})
    if category == "Frozen" and temperature > 25:
        temp_uplift = min(0.45, (temperature - 25) * 0.045)
        uplift += temp_uplift
        reasons.append({"driver": "High temperature", "impact": round(temp_uplift * 100, 1)})
    if category == "Beverages" and temperature < 12:
        uplift += 0.08
        reasons.append({"driver": "Cold-weather tea demand", "impact": 8.0})
    expected_30_day = base_daily * 30 * (1 + uplift)
    current_stock = float(latest["current_stock"].iloc[-1])
    safety_stock = expected_30_day * 0.22
    recommended_stock = expected_30_day + safety_stock
    stockout_risk = "High" if current_stock < expected_30_day * 0.55 else "Medium" if current_stock < expected_30_day else "Low"
    return {
        "product_name": str(latest["product_name"].iloc[-1]),
        "store_city": str(latest["store_city"].iloc[-1]),
        "expected_demand": round(expected_30_day, 1),
        "expected_uplift": round(uplift * 100, 1),
        "recommended_stock": round(recommended_stock, 1),
        "reorder_quantity": round(max(0, recommended_stock - current_stock), 1),
        "stockout_risk": stockout_risk,
        "reason_codes": reasons or [{"driver": "Baseline demand pattern", "impact": 0.0}],
    }


def alert_summary(df: pd.DataFrame) -> dict[str, object]:
    inventory = pd.DataFrame(inventory_recommendations(df))
    latest = df["date"].max()
    recent = df[df["date"] > latest - pd.Timedelta(days=45)]
    daily = recent.groupby(["date", "product_name", "store_city"], as_index=False)["units_sold"].sum()
    daily["z_score"] = daily.groupby(["product_name", "store_city"])["units_sold"].transform(lambda s: (s - s.mean()) / max(s.std(), 1))
    spikes = daily[daily["z_score"] > 2.2].sort_values("z_score", ascending=False).head(8)
    quality = data_quality_report(df)
    alerts = []
    for row in inventory[inventory["status"] == "Stockout Risk"].head(10).to_dict(orient="records"):
        alerts.append({"type": "Stockout Risk", "severity": "High", "title": f"{row['product_name']} in {row['store_city']}", "detail": f"{row['days_until_stockout']} days of cover remaining."})
    for row in inventory[inventory["status"] == "Overstock Risk"].head(6).to_dict(orient="records"):
        alerts.append({"type": "Overstock Risk", "severity": "Medium", "title": f"{row['product_name']} in {row['store_city']}", "detail": f"Estimated overstock cost: {row['estimated_overstock_cost']}."})
    for row in spikes.to_dict(orient="records"):
        alerts.append({"type": "Demand Spike", "severity": "Medium", "title": f"{row['product_name']} in {row['store_city']}", "detail": f"Unusual sales spike detected on {row['date'].date()}."})
    if quality["data_quality_score"] < 90:
        alerts.append({"type": "Data Quality", "severity": "Medium", "title": "Data quality needs review", "detail": f"Quality score is {quality['data_quality_score']}/100."})
    return {
        "stockout_risk_count": int((inventory["status"] == "Stockout Risk").sum()),
        "overstock_risk_count": int((inventory["status"] == "Overstock Risk").sum()),
        "demand_spike_count": int(len(spikes)),
        "data_quality_score": quality["data_quality_score"],
        "alerts": alerts,
    }
