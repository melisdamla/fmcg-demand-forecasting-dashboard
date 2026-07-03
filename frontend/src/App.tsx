import { useState } from "react";
import { AlertTriangle, BarChart3, BrainCircuit, Boxes, Home, LineChart, SlidersHorizontal, UploadCloud } from "lucide-react";
import Alerts from "./pages/Alerts";
import Dashboard from "./pages/Dashboard";
import DataUpload from "./pages/DataUpload";
import Forecasting from "./pages/Forecasting";
import Inventory from "./pages/Inventory";
import Insights from "./pages/Insights";
import Simulator from "./pages/Simulator";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "upload", label: "Data Upload", icon: UploadCloud },
  { id: "forecast", label: "Forecasting", icon: LineChart },
  { id: "simulator", label: "What-if", icon: SlidersHorizontal },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "insights", label: "Insights", icon: BrainCircuit },
  { id: "alerts", label: "Alerts", icon: AlertTriangle }
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  return (
    <div className="min-h-screen bg-cloud text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-5 py-6 lg:block">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal text-white">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-5">FMCG Demand</p>
            <p className="text-xs text-muted">Inventory Optimizer</p>
          </div>
        </div>
        <nav className="mt-8 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  active ? "bg-teal text-white" : "text-muted hover:bg-slate-100 hover:text-ink"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="lg:pl-64">
        <header className="border-b border-line bg-white px-5 py-4 sm:px-7">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">FMCG Demand Forecasting & Inventory Optimizer</h1>
              <p className="mt-1 text-sm text-muted">Sales simulation, demand forecasts, stock risk, and business drivers.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto lg:hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    activeTab === tab.id ? "bg-teal text-white" : "bg-slate-100 text-muted"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>
        <div className="px-5 py-6 sm:px-7">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "upload" && <DataUpload />}
          {activeTab === "forecast" && <Forecasting />}
          {activeTab === "simulator" && <Simulator />}
          {activeTab === "inventory" && <Inventory />}
          {activeTab === "insights" && <Insights />}
          {activeTab === "alerts" && <Alerts />}
        </div>
      </main>
    </div>
  );
}
