# FMCG Demand Forecasting & Inventory Optimizer

A modern full-stack analytics dashboard for simulating demand forecasting and inventory optimization in a fast-moving consumer goods business. The app models products such as shampoo, ice cream, tea, detergent, and skincare products across 20 stores, then turns historical sales, promotions, holidays, seasonality, and weather into demand forecasts and replenishment recommendations.

## Business Problem

FMCG companies need to keep products available without tying too much cash in inventory. Demand can shift quickly because of promotions, holidays, weather, and store-level seasonality. This project demonstrates how a data team can combine synthetic sales data, machine learning forecasts, and simple inventory rules to help category and supply chain teams decide what to reorder.

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── data_generator.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── ml.py
│   │   └── services.py
│   ├── scripts/
│   │   └── generate_data.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── data/
├── models/
├── notebooks/
└── README.md
```

## Dataset Description

The sample data generation script creates at least 2 years of daily sales data for 10 products and 20 stores. Each row includes:

- `date`
- `store_id`
- `store_city`
- `product_id`
- `product_name`
- `category`
- `price`
- `units_sold`
- `promotion`
- `discount_percentage`
- `holiday`
- `temperature`
- `rainfall`
- `current_stock`
- `revenue`

The simulation includes weekly patterns, yearly seasonality, city-level weather differences, holiday uplift, promotion lift, temperature-driven ice cream demand, and replenishment behavior.

## ML Approach

The backend trains a `RandomForestRegressor` for the selected product-store pair. Features include:

- Calendar features: day of week, month, day of year
- Commercial features: promotion, discount percentage, holiday flag
- Weather features: temperature and rainfall
- Time-series features: 7-day lag and 14-day rolling demand

The demand forecasting page reports MAE, RMSE, and MAPE, then produces a 30-day forecast with a simple confidence band based on model validation error.

## Features

- Dashboard homepage with total sales, forecasted demand, stock risk score, top products, stockout risk, excess inventory, category performance, and sales trend
- Synthetic FMCG data generation with realistic business drivers
- Demand forecasting page with product/store filters, historical demand, next 30-day forecast, confidence interval, and model metrics
- Data Upload page for company CSV/Excel files with column validation, mapping suggestions, data cleaning, preview, database save, and retrain-ready status
- Data quality report with missing values, duplicate rows, invalid dates, negative sales, outlier days, and model readiness score
- Demand forecasting page with product/store filters, historical demand, next 30-day forecast, confidence interval, model comparison, best-model selection, and feature importance
- What-if Simulator for promotion, discount, holiday, and weather scenarios
- Inventory optimization page with recommended stock, reorder quantity, days until stockout, status flags, estimated lost revenue avoided, estimated overstock cost, and reorder timing
- Business insights page showing promotion impact, promotion ROI, category comparison, weather effects, holiday lift, and written insights
- Alert system for stockout risk, overstock risk, demand spikes, and data quality alerts
- SQLite database initialization from generated data
- Corporate-style React dashboard built with TypeScript, Tailwind CSS, Recharts, and lucide icons

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, Recharts, lucide-react
- Backend: Python, FastAPI
- Data/ML: Pandas, NumPy, Scikit-learn RandomForestRegressor
- Database: SQLite
- Tooling: Vite, Uvicorn

## Screenshots

Add screenshots here after running the app locally:

- Dashboard homepage
- Demand forecasting page
- Inventory optimization page
- Business insights page

## How to Run Locally

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/generate_data.py
uvicorn app.main:app --reload
```

The API will run at `http://localhost:8000`.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Or with pnpm:

```bash
cd frontend
pnpm install
pnpm run dev
```

The dashboard will run at `http://localhost:5173`.

### 3. API Endpoints

- `GET /health`
- `GET /api/options`
- `GET /api/dashboard`
- `GET /api/forecast?product_id=P002&store_id=S005`
- `GET /api/inventory`
- `GET /api/insights`
- `GET /api/data-quality`
- `POST /api/upload/sales`
- `POST /api/upload/inventory`
- `POST /api/upload/promotions`
- `POST /api/upload/products`
- `GET /api/scenario?product_id=P002&store_id=S005&discount=20&temperature=30&holiday=true&promotion=true`
- `GET /api/alerts`

## Inventory Logic

The optimizer uses straightforward business rules:

```text
recommended_stock = forecasted_30_day_demand + safety_stock
reorder_quantity = max(0, recommended_stock - current_stock)
```

Products are flagged as:

- `Healthy Stock`
- `Stockout Risk`
- `Overstock Risk`

## Future Improvements

- Persist trained models in the `/models` directory
- Add XGBoost and compare model performance
- Add store clustering and regional forecast views
- Include supplier lead times and service-level targets
- Add authentication and role-based views for category managers
- Add automated notebook analysis in `/notebooks`
- Add Slack/email delivery for operational alerts
- Add multi-tenant company workspaces and user permissions
