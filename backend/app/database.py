from __future__ import annotations

from pathlib import Path
import sqlite3

import pandas as pd

from .data_generator import save_sales_data


ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT / "data" / "sales_data.csv"
DB_PATH = ROOT / "data" / "fmcg_forecasting.sqlite"


def ensure_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        return save_sales_data(DATA_PATH)
    return pd.read_csv(DATA_PATH, parse_dates=["date"])


def load_sales_data() -> pd.DataFrame:
    df = ensure_data()
    if not pd.api.types.is_datetime64_any_dtype(df["date"]):
        df["date"] = pd.to_datetime(df["date"])
    return df


def initialize_database() -> None:
    df = load_sales_data()
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        df.to_sql("sales", conn, if_exists="replace", index=False)
