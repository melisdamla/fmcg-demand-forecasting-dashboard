from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
import math
import random

import numpy as np
import pandas as pd


PRODUCTS = [
    ("P001", "SilkSoft Shampoo", "Personal Care", 6.99, 38),
    ("P002", "Arctic Vanilla Ice Cream", "Frozen", 4.49, 52),
    ("P003", "Emerald Green Tea", "Beverages", 3.29, 44),
    ("P004", "BrightWash Detergent", "Home Care", 8.99, 30),
    ("P005", "GlowDaily Skincare Cream", "Skincare", 12.99, 26),
    ("P006", "FamilyCare Soap Pack", "Personal Care", 5.49, 41),
    ("P007", "Berry Burst Ice Cream", "Frozen", 4.99, 48),
    ("P008", "English Breakfast Tea", "Beverages", 3.79, 39),
    ("P009", "FreshHome Floor Cleaner", "Home Care", 7.49, 28),
    ("P010", "HydraPlus Face Serum", "Skincare", 15.99, 22),
]

STORES = [
    ("S001", "Istanbul"), ("S002", "Ankara"), ("S003", "Izmir"), ("S004", "Bursa"),
    ("S005", "Antalya"), ("S006", "Konya"), ("S007", "Adana"), ("S008", "Gaziantep"),
    ("S009", "Mersin"), ("S010", "Kayseri"), ("S011", "Paris"), ("S012", "Lyon"),
    ("S013", "Berlin"), ("S014", "Munich"), ("S015", "Madrid"), ("S016", "Barcelona"),
    ("S017", "Rome"), ("S018", "Milan"), ("S019", "Amsterdam"), ("S020", "Brussels"),
]

CITY_TEMP_OFFSET = {
    "Antalya": 4.5, "Adana": 3.5, "Mersin": 3.0, "Izmir": 2.0, "Istanbul": 0.5,
    "Bursa": 0.0, "Gaziantep": 1.0, "Konya": -1.5, "Ankara": -2.0, "Kayseri": -3.0,
    "Paris": -0.5, "Lyon": 0.0, "Berlin": -2.5, "Munich": -3.0, "Madrid": 3.0,
    "Barcelona": 2.5, "Rome": 2.0, "Milan": -0.5, "Amsterdam": -2.0, "Brussels": -1.5,
}

HOLIDAY_DATES = {
    (1, 1), (2, 14), (4, 23), (5, 1), (8, 30), (10, 29), (11, 11), (12, 24), (12, 25), (12, 31)
}


@dataclass(frozen=True)
class GeneratorConfig:
    start_date: date = date(2024, 1, 1)
    end_date: date = date(2025, 12, 31)
    seed: int = 42


def _seasonality(day_of_year: int) -> float:
    return 1 + 0.12 * math.sin(2 * math.pi * day_of_year / 365)


def generate_sales_data(config: GeneratorConfig = GeneratorConfig()) -> pd.DataFrame:
    random.seed(config.seed)
    np.random.seed(config.seed)
    rows: list[dict[str, object]] = []
    dates = pd.date_range(config.start_date, config.end_date, freq="D")
    stock_state: dict[tuple[str, str], int] = {}

    for store_id, city in STORES:
        store_multiplier = random.uniform(0.78, 1.28)
        for product_id, _, _, _, base_stock in PRODUCTS:
            stock_state[(store_id, product_id)] = int(base_stock * random.uniform(7, 13))

        for dt in dates:
            day = dt.date()
            day_of_year = int(dt.strftime("%j"))
            weekday = dt.weekday()
            weekend_multiplier = 1.14 if weekday >= 5 else 1.0
            holiday = (day.month, day.day) in HOLIDAY_DATES
            temp = 14 + 12 * math.sin(2 * math.pi * (day_of_year - 80) / 365) + CITY_TEMP_OFFSET[city]
            temp += np.random.normal(0, 2.1)
            rainfall = max(0, np.random.gamma(1.4, 2.0) - max(temp - 22, 0) * 0.18)

            for product_id, product_name, category, price, base_demand in PRODUCTS:
                promo = random.random() < (0.19 if category in {"Personal Care", "Home Care"} else 0.14)
                discount = round(random.choice([0.05, 0.1, 0.15, 0.2, 0.25]), 2) if promo else 0.0

                demand = base_demand * store_multiplier * _seasonality(day_of_year) * weekend_multiplier
                if promo:
                    demand *= 1 + discount * random.uniform(1.7, 2.5)
                if holiday:
                    demand *= 1.22 if category in {"Beverages", "Frozen", "Personal Care"} else 1.12
                if category == "Frozen":
                    demand *= 1 + max(temp - 20, 0) * 0.045
                    demand *= 0.94 if rainfall > 7 else 1.0
                if category == "Beverages":
                    demand *= 1 + max(12 - temp, 0) * 0.018
                if category == "Skincare":
                    demand *= 1 + max(temp - 24, 0) * 0.015
                if category == "Home Care":
                    demand *= 1.08 if weekday in {5, 6} else 1.0

                units_sold = max(0, int(np.random.normal(demand, max(3, demand * 0.16))))
                key = (store_id, product_id)
                available_stock = stock_state[key]
                units_sold = min(units_sold, available_stock)
                ending_stock = available_stock - units_sold

                if ending_stock < base_demand * 4 and random.random() < 0.34:
                    ending_stock += int(base_demand * random.uniform(8, 15))

                rows.append({
                    "date": day.isoformat(),
                    "store_id": store_id,
                    "store_city": city,
                    "product_id": product_id,
                    "product_name": product_name,
                    "category": category,
                    "price": price,
                    "units_sold": units_sold,
                    "promotion": int(promo),
                    "discount_percentage": int(discount * 100),
                    "holiday": int(holiday),
                    "temperature": round(float(temp), 1),
                    "rainfall": round(float(rainfall), 1),
                    "current_stock": int(ending_stock),
                    "revenue": round(units_sold * price * (1 - discount), 2),
                })
                stock_state[key] = ending_stock

    df = pd.DataFrame(rows)
    return df.sort_values(["date", "store_id", "product_id"]).reset_index(drop=True)


def save_sales_data(output_path: str | Path) -> pd.DataFrame:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    df = generate_sales_data()
    df.to_csv(path, index=False)
    return df
