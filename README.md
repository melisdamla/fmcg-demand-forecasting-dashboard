# FMCG Demand Forecasting & Inventory Optimizer

A full-stack analytics platform that simulates demand forecasting, inventory optimization, and business intelligence workflows for a fast-moving consumer goods company.

The project models daily sales for FMCG products such as shampoo, ice cream, tea, detergent, and skincare items across 20 stores. It combines historical sales, promotions, holidays, seasonality, weather conditions, and store-level demand patterns to generate machine learning forecasts and replenishment recommendations.

This project is designed as an end-to-end data product: synthetic data generation, data validation, forecasting models, inventory rules, business insights, alerts, backend APIs, and a modern React dashboard.

---

## Business Context

FMCG companies must balance two competing goals:

1. Keep products available to avoid lost sales and stockouts.
2. Avoid holding too much inventory, which increases storage costs and ties up working capital.

Demand can change quickly due to promotions, holidays, weather, seasonality, regional preferences, and store-level behavior. This project demonstrates how a data and analytics team can support category managers, supply chain teams, and store operations by turning raw sales data into actionable forecasting and replenishment decisions.

---

## Key Highlights

* Built an end-to-end full-stack analytics dashboard with React, TypeScript, Tailwind CSS, FastAPI, and SQLite.
* Generated a realistic synthetic FMCG dataset with 2 years of daily sales data, 10 products, and 20 stores.
* Trained machine learning demand forecasting models using historical demand, calendar effects, promotions, holidays, weather, lag features, and rolling averages.
* Created inventory optimization logic to recommend reorder quantities and identify stockout or overstock risks.
* Added business insight modules for promotion impact, category performance, weather effects, holiday uplift, and alert monitoring.
* Implemented data upload and data quality checks to simulate a real company data ingestion workflow.
* Designed the dashboard for business users, with clear KPIs, charts, recommendations, and operational alerts.

---

## Screenshots

<img width="1362" height="907" alt="Dashboard Screenshot" src="https://github.com/user-attachments/assets/013b568e-5ad9-48f4-87ba-909c49ad706f" />

<img width="1362" height="907" alt="Forecasting Screenshot" src="https://github.com/user-attachments/assets/42d25bfb-b095-43ef-b797-2c4cd8952df2" />

<img width="1362" height="907" alt="Inventory Screenshot" src="https://github.com/user-attachments/assets/be0562d6-2afa-4c95-8481-78748eb09c2f" />

<img width="1362" height="907" alt="Business Insights Screenshot" src="https://github.com/user-attachments/assets/779c9267-0eef-4c43-bbe8-1be1158ce457" />

<img width="1362" height="907" alt="Analytics Screenshot" src="https://github.com/user-attachments/assets/dc15246b-b01f-4101-991a-289f5d20f414" />

<img width="1362" height="907" alt="Data Upload Screenshot" src="https://github.com/user-attachments/assets/01813f0a-1844-409e-b324-0acdde83e29c" />

<img width="1362" height="907" alt="Alerts Screenshot" src="https://github.com/user-attachments/assets/62a13475-cafc-430b-8eae-dc6f8b0bbcfc" />

---

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

---

## Dataset

The project includes a synthetic data generation pipeline that creates at least 2 years of daily FMCG sales data across 10 products and 20 stores.

Each row contains:

* `date`
* `store_id`
* `store_city`
* `product_id`
* `product_name`
* `category`
* `price`
* `units_sold`
* `promotion`
* `discount_percentage`
* `holiday`
* `temperature`
* `rainfall`
* `current_stock`
* `revenue`

The dataset is designed to simulate realistic commercial patterns, including:

* Weekly sales cycles
* Yearly seasonality
* Product-specific demand behavior
* City-level weather differences
* Promotion-driven uplift
* Holiday demand spikes
* Temperature-sensitive categories such as ice cream
* Store-level inventory fluctuations
* Replenishment behavior

---

## Machine Learning Approach

The backend trains a demand forecasting model for a selected product-store pair.

The forecasting pipeline uses a `RandomForestRegressor` with features such as:

### Calendar Features

* Day of week
* Month
* Day of year
* Weekend effects

### Commercial Features

* Promotion flag
* Discount percentage
* Holiday flag

### Weather Features

* Temperature
* Rainfall

### Time-Series Features

* 7-day lag demand
* 14-day rolling average demand

The forecasting page displays:

* Historical demand
* 30-day demand forecast
* Confidence interval based on validation error
* MAE
* RMSE
* MAPE
* Model comparison
* Best-model selection
* Feature importance

---

## Inventory Optimization Logic

The inventory module converts demand forecasts into replenishment recommendations.

The core logic is:

```text
recommended_stock = forecasted_30_day_demand + safety_stock
reorder_quantity = max(0, recommended_stock - current_stock)
```

Each product-store combination is classified into one of the following statuses:

* `Healthy Stock`
* `Stockout Risk`
* `Overstock Risk`

The inventory dashboard includes:

* Recommended stock level
* Reorder quantity
* Days until stockout
* Estimated lost revenue avoided
* Estimated overstock cost
* Reorder timing recommendation
* Risk flags by product and store

---

## Main Features

### Executive Dashboard

The homepage provides a high-level view of business performance:

* Total sales
* Forecasted demand
* Stock risk score
* Top-performing products
* Stockout risk
* Excess inventory
* Category performance
* Sales trend over time

### Demand Forecasting

The forecasting module allows users to select a product and store, then view:

* Historical demand
* 30-day forecast
* Confidence interval
* Forecast accuracy metrics
* Model comparison
* Feature importance

### Data Upload

The data upload module simulates a company data ingestion workflow.

It supports CSV and Excel uploads for:

* Sales data
* Inventory data
* Promotions data
* Product data

The upload flow includes:

* Column validation
* Mapping suggestions
* Data cleaning
* Data preview
* Database save
* Retrain-ready status

### Data Quality Report

The data quality module checks whether uploaded data is suitable for analytics and forecasting.

It reports:

* Missing values
* Duplicate rows
* Invalid dates
* Negative sales
* Outlier days
* Model readiness score

### What-If Simulator

The scenario simulator allows users to test demand changes under different conditions, such as:

* Promotion on/off
* Discount percentage
* Holiday periods
* Temperature changes
* Weather variation

This helps business users estimate how demand may react before launching a promotion or adjusting stock levels.

### Business Insights

The insights page translates model outputs into business-friendly observations, including:

* Promotion impact
* Promotion ROI
* Category comparison
* Weather effects
* Holiday lift
* Written business recommendations

### Alert System

The alert module surfaces operational risks, including:

* Stockout risk
* Overstock risk
* Demand spikes
* Data quality alerts

---

## Tech Stack

### Frontend

* React
* TypeScript
* Tailwind CSS
* Recharts
* lucide-react
* Vite

### Backend

* Python
* FastAPI
* Uvicorn

### Data & Machine Learning

* Pandas
* NumPy
* Scikit-learn
* RandomForestRegressor

### Database

* SQLite

---

## API Endpoints

| Method | Endpoint                                                                                             | Description                            |
| ------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `GET`  | `/health`                                                                                            | API health check                       |
| `GET`  | `/api/options`                                                                                       | Product and store filter options       |
| `GET`  | `/api/dashboard`                                                                                     | Dashboard KPI and chart data           |
| `GET`  | `/api/forecast?product_id=P002&store_id=S005`                                                        | 30-day demand forecast                 |
| `GET`  | `/api/inventory`                                                                                     | Inventory optimization recommendations |
| `GET`  | `/api/insights`                                                                                      | Business insight summaries             |
| `GET`  | `/api/data-quality`                                                                                  | Data quality report                    |
| `POST` | `/api/upload/sales`                                                                                  | Upload sales dataset                   |
| `POST` | `/api/upload/inventory`                                                                              | Upload inventory dataset               |
| `POST` | `/api/upload/promotions`                                                                             | Upload promotions dataset              |
| `POST` | `/api/upload/products`                                                                               | Upload product dataset                 |
| `GET`  | `/api/scenario?product_id=P002&store_id=S005&discount=20&temperature=30&holiday=true&promotion=true` | What-if scenario simulation            |
| `GET`  | `/api/alerts`                                                                                        | Operational alert system               |

---

## How to Run Locally

### 1. Start the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/generate_data.py
uvicorn app.main:app --reload
```

The backend API will run at:

```text
http://localhost:8000
```

### 2. Start the Frontend

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

The dashboard will run at:

```text
http://localhost:5173
```

---

## Example Use Case

A category manager wants to know whether ice cream stock should be increased before a hot weekend.

Using the dashboard, they can:

1. Select the ice cream product and store.
2. Review historical sales and the 30-day forecast.
3. Simulate a higher temperature scenario.
4. Check whether the product is at risk of stockout.
5. View the recommended reorder quantity.
6. Estimate potential lost revenue avoided by replenishing earlier.

This mirrors how forecasting and inventory analytics can support real business decisions in retail and FMCG operations.

---

## What I Learned

This project strengthened my skills in:

* Designing end-to-end data products
* Building machine learning workflows for business forecasting
* Creating synthetic datasets with realistic business behavior
* Developing REST APIs with FastAPI
* Building interactive dashboards with React and TypeScript
* Translating model outputs into business recommendations
* Thinking about data quality, model readiness, and operational decision-making

---

## Future Improvements

* Persist trained models in the `/models` directory
* Add XGBoost and LightGBM model comparison
* Add store clustering and regional forecast views
* Include supplier lead times and service-level targets
* Add probabilistic forecasting
* Add authentication and role-based access for category managers
* Add automated notebook analysis in `/notebooks`
* Add Slack or email delivery for operational alerts
* Add multi-tenant company workspaces and user permissions
* Deploy the backend and frontend to a cloud platform

---

