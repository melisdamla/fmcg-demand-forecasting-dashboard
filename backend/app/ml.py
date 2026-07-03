from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, root_mean_squared_error


FEATURES = [
    "day_of_week",
    "month",
    "day_of_year",
    "promotion",
    "discount_percentage",
    "holiday",
    "temperature",
    "rainfall",
    "lag_7",
    "rolling_14",
]


@dataclass
class ForecastResult:
    history: list[dict[str, object]]
    forecast: list[dict[str, object]]
    metrics: dict[str, float]
    model_comparison: list[dict[str, object]]
    best_model: str
    feature_importance: list[dict[str, object]]


def _prepare_series(df: pd.DataFrame, product_id: str, store_id: str) -> pd.DataFrame:
    series = df[(df["product_id"] == product_id) & (df["store_id"] == store_id)].copy()
    series = series.sort_values("date").reset_index(drop=True)
    series["day_of_week"] = series["date"].dt.dayofweek
    series["month"] = series["date"].dt.month
    series["day_of_year"] = series["date"].dt.dayofyear
    series["lag_7"] = series["units_sold"].shift(7)
    series["rolling_14"] = series["units_sold"].shift(1).rolling(14).mean()
    return series.dropna().reset_index(drop=True)


def forecast_product_store(df: pd.DataFrame, product_id: str, store_id: str, horizon: int = 30) -> ForecastResult:
    series = _prepare_series(df, product_id, store_id)
    if len(series) < 90:
        raise ValueError("Not enough history to build a forecast for this product and store.")

    split_index = int(len(series) * 0.82)
    train = series.iloc[:split_index]
    test = series.iloc[split_index:]

    model_candidates = {
        "Naive Baseline": np.repeat(train["units_sold"].tail(7).mean(), len(test)),
        "Moving Average": np.repeat(train["units_sold"].tail(28).mean(), len(test)),
    }
    linear = LinearRegression()
    linear.fit(train[FEATURES], train["units_sold"])
    model_candidates["Trend + Seasonality"] = linear.predict(test[FEATURES])
    forest = RandomForestRegressor(n_estimators=180, random_state=7, min_samples_leaf=3, n_jobs=-1)
    forest.fit(train[FEATURES], train["units_sold"])
    model_candidates["RandomForest"] = forest.predict(test[FEATURES])

    comparison = []
    for name, candidate_predictions in model_candidates.items():
        comparison.append({
            "model": name,
            "mae": round(float(mean_absolute_error(test["units_sold"], candidate_predictions)), 2),
            "rmse": round(float(root_mean_squared_error(test["units_sold"], candidate_predictions)), 2),
            "mape": round(float(np.mean(np.abs((test["units_sold"].values - candidate_predictions) / np.maximum(test["units_sold"].values, 1))) * 100), 2),
        })
    comparison = sorted(comparison, key=lambda row: row["mape"])
    best_model_name = str(comparison[0]["model"])
    predictions = np.asarray(model_candidates[best_model_name])
    mae = float(mean_absolute_error(test["units_sold"], predictions))
    rmse = float(root_mean_squared_error(test["units_sold"], predictions))
    mape = float(np.mean(np.abs((test["units_sold"].values - predictions) / np.maximum(test["units_sold"].values, 1))) * 100)

    model = RandomForestRegressor(n_estimators=180, random_state=7, min_samples_leaf=3, n_jobs=-1)
    model.fit(series[FEATURES], series["units_sold"])
    future_rows = []
    rolling_sales = series["units_sold"].tolist()
    last_date = series["date"].max()
    baseline_weather = series.tail(45)[["temperature", "rainfall"]].mean()
    promo_rate = float(series.tail(120)["promotion"].mean())

    for i in range(1, horizon + 1):
        future_date = last_date + pd.Timedelta(days=i)
        is_weekend = future_date.dayofweek >= 5
        planned_promo = 1 if (i % 11 == 0 or promo_rate > 0.22 and i % 9 == 0) else 0
        discount = 15 if planned_promo else 0
        holiday = int((future_date.month, future_date.day) in {(1, 1), (5, 1), (8, 30), (10, 29), (12, 25), (12, 31)})
        row = {
            "day_of_week": future_date.dayofweek,
            "month": future_date.month,
            "day_of_year": future_date.dayofyear,
            "promotion": planned_promo,
            "discount_percentage": discount,
            "holiday": holiday,
            "temperature": float(baseline_weather["temperature"] + np.sin(i / 6) * 1.8),
            "rainfall": float(max(0, baseline_weather["rainfall"] + np.cos(i / 4) * 0.8)),
            "lag_7": rolling_sales[-7],
            "rolling_14": float(np.mean(rolling_sales[-14:])),
        }
        predicted = max(0, float(model.predict(pd.DataFrame([row]))[0]))
        interval = max(mae * 1.35, predicted * 0.12)
        rolling_sales.append(predicted)
        future_rows.append({
            "date": future_date.date().isoformat(),
            "forecast": round(predicted, 1),
            "lower": round(max(0, predicted - interval), 1),
            "upper": round(predicted + interval, 1),
            "promotion": planned_promo,
            "holiday": holiday,
            "is_weekend": is_weekend,
        })

    history = series.tail(180)[["date", "units_sold", "promotion", "holiday", "temperature"]].copy()
    history["date"] = history["date"].dt.date.astype(str)

    return ForecastResult(
        history=history.to_dict(orient="records"),
        forecast=future_rows,
        metrics={"mae": round(mae, 2), "rmse": round(rmse, 2), "mape": round(mape, 2)},
        model_comparison=comparison,
        best_model=best_model_name,
        feature_importance=[
            {"feature": feature, "importance": round(float(value) * 100, 1)}
            for feature, value in sorted(zip(FEATURES, model.feature_importances_), key=lambda item: item[1], reverse=True)
        ],
    )
