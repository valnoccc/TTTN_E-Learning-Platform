import { type ReactNode } from 'react';

type ClassicCardProps = {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  sticky?: boolean;
  className?: string;
};

export default function ClassicCard({ title, icon, children, sticky = false, className = '' }: ClassicCardProps) {
  return (
    <section
      className={`overflow-hidden border border-[#d1d7dc] bg-white ${sticky ? 'lg:sticky lg:top-6' : ''} ${className}`}
    >
      {title ? (
        <div className="flex items-center gap-3 border-b border-[#d1d7dc] bg-[#f7f9fa] px-5 py-4">
          {icon ? <div className="flex h-8 w-8 items-center justify-center border border-[#d1d7dc] bg-white text-[#1dbf73]">{icon}</div> : null}
          <h2 className="text-[15px] font-bold text-[#2c3e50]">{title}</h2>
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}
