type StudentSectionTitleProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export default function StudentSectionTitle({ eyebrow, title, description }: StudentSectionTitleProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F67B1]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#172B4D] sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}
