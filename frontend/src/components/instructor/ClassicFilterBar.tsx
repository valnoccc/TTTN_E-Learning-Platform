import { Search } from 'lucide-react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';

type FilterOption = {
    label: string;
    value: string;
};

interface ClassicFilterBarProps {
    searchValue: string;
    onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onSearchKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
    searchPlaceholder?: string;
    selectValue: string;
    onSelectChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    options: FilterOption[];
    action: ReactNode;
}

export default function ClassicFilterBar({
    searchValue,
    onSearchChange,
    onSearchKeyDown,
    searchPlaceholder = 'Tìm kiếm',
    selectValue,
    onSelectChange,
    options,
    action,
}: ClassicFilterBarProps) {
    return (
        <section className="border border-[#d1d7dc] bg-white p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_260px_auto]">
                <label className="flex items-center gap-3 border border-[#d1d7dc] bg-white px-4 py-3">
                    <Search size={16} className="text-slate-400" />
                    <input
                        value={searchValue}
                        onChange={onSearchChange}
                        onKeyDown={onSearchKeyDown}
                        placeholder={searchPlaceholder}
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                </label>

                <select
                    value={selectValue}
                    onChange={onSelectChange}
                    className="border border-[#d1d7dc] bg-white px-4 py-3 text-sm text-slate-800 outline-none"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <div className="flex">{action}</div>
            </div>
        </section>
    );
}
