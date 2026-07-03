import { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "teal" | "coral" | "amber" | "blue";
};

const toneClasses = {
  teal: "bg-teal/10 text-teal",
  coral: "bg-coral/10 text-coral",
  amber: "bg-amber/10 text-amber",
  blue: "bg-sky-100 text-sky-700"
};

export default function KpiCard({ label, value, detail, icon: Icon, tone = "teal" }: Props) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
          <p className="mt-1 text-sm text-muted">{detail}</p>
        </div>
        <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
    </section>
  );
}
