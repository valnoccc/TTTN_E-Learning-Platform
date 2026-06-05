import { type ReactNode } from 'react';

type ClassicPanelNoteProps = {
  title: string;
  children: ReactNode;
};

export default function ClassicPanelNote({ title, children }: ClassicPanelNoteProps) {
  return (
    <div className="border border-[#d1d7dc] bg-[#f9fbfb] p-6">
      <h4 className="mb-2 text-[14px] font-bold text-[#2c3e50]">{title}</h4>
      <div className="text-xs leading-relaxed text-[#7a828a]">{children}</div>
    </div>
  );
}
