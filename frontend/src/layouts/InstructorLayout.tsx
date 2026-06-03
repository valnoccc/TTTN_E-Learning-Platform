import { type ReactNode } from 'react';
import InstructorSidebar from '../components/common/InstructorSidebar';
import { Search } from 'lucide-react';

interface InstructorLayoutProps {
    children: ReactNode;
}

export default function InstructorLayout({ children }: InstructorLayoutProps) {
    return (
        <div className="flex min-h-screen bg-[#f8f9fa] text-slate-800">
            <InstructorSidebar />

            <div className="relative z-0 flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-slate-200 bg-white px-6 shadow-sm lg:px-8">
                    <div className="flex w-full max-w-[420px] flex-none items-center rounded-md border border-slate-200 bg-white px-3.5 py-2.5 transition focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                        <Search size={16} className="mr-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nội dung..."
                            className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />
                    </div>
                </header>

                <main className="flex-grow p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>
        </div>
    );
}
