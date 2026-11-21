import type { ReactNode } from "react";

interface StatHighlightProps {
  icon: ReactNode;
  label: string;
  value: string;
}

export const StatHighlight = ({ icon, label, value }: StatHighlightProps) => (
  <div className="card border border-base-300 bg-base-100 shadow-sm">
    <div className="card-body flex-row items-center gap-4 px-6 py-4">
      <div className="text-primary">{icon}</div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral">{label}</p>
        <p className="text-2xl font-semibold text-primary">{value}</p>
      </div>
    </div>
  </div>
);
