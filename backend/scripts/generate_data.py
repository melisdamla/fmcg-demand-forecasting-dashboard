from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(ROOT / "backend"))

from app.data_generator import save_sales_data


if __name__ == "__main__":
    output = ROOT / "data" / "sales_data.csv"
    df = save_sales_data(output)
    print(f"Generated {len(df):,} rows at {output}")
