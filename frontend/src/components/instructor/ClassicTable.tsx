import { type ReactNode } from 'react';

type ClassicTableProps = {
  headers: string[];
  children: ReactNode;
};

export default function ClassicTable({ headers, children }: ClassicTableProps) {
  return (
    <div className="overflow-hidden border border-[#d1d7dc] bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border-b border-[#d1d7dc] bg-[#f7f9fa] px-4 py-3 text-left text-[13px] font-bold text-[#2c3e50]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
