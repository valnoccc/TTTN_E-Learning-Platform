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
        <section className=" bg-white p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_260px_auto]">
                {/* Ô Nhập Tìm Kiếm */}
                <label className="flex h-[44px] items-center gap-3 border border-[#d1d7dc] bg-white px-4">
                    <Search size={16} className="text-slate-400" />
                    <input
                        value={searchValue}
                        onChange={onSearchChange}
                        onKeyDown={onSearchKeyDown}
                        placeholder={searchPlaceholder}
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 h-full"
                    />
                </label>

                {/* Ô Chọn Khóa Học */}
                <select
                    value={selectValue}
                    onChange={onSelectChange}
                    className="h-[44px] border border-[#d1d7dc] bg-white px-4 text-sm text-slate-800 outline-none"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {/* Nút Bấm Action */}
                <div className="flex h-[44px]">
                    {action}
                </div>
            </div>
        </section>
    );
}
