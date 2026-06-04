import { Link, useLocation } from 'react-router-dom';

type TabItem = {
  label: string;
  path: string;
};

type ClassicTabsProps = {
  items: TabItem[];
};

export default function ClassicTabs({ items }: ClassicTabsProps) {
  const location = useLocation();

  return (
    <div className="mb-5 flex gap-6 border-b border-[#d1d7dc] bg-white px-5">
      {items.map((item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`py-4 text-[14px] font-bold border-b-4 transition ${
              isActive
                ? 'border-[#1dbf73] text-[#1dbf73]'
                : 'border-transparent text-[#7a828a] hover:text-[#2c3e50]'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
