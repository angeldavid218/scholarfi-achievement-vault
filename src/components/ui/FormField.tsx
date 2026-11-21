import type { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}

export const FormField = ({ id, label, hint, children }: FormFieldProps) => (
  <div className="form-control w-full gap-1">
    <label className="label px-0 pt-0" htmlFor={id}>
      <span className="label-text text-xs font-semibold tracking-wide text-neutral">
        {label}
      </span>
    </label>
    {children}
    {hint ? <p className="text-xs text-neutral/80">{hint}</p> : null}
  </div>
);
