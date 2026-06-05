import { type ReactNode } from 'react';

type ClassicFormFieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export default function ClassicFormField({ label, children, hint }: ClassicFormFieldProps) {
  return (
    <div className="form-group">
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#7a828a]">{label}</label>
      {children}
      {hint ? <p className="mt-2 text-[10px] text-[#7a828a]">{hint}</p> : null}
    </div>
  );
}
