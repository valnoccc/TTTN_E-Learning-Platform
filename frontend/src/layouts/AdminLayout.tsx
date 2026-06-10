import { type ReactNode } from 'react';

import AdminSidebar from '../components/common/AdminSidebar';

// Nếu bạn có một Header chung cho Admin ở trên cùng, bạn có thể import vào đây
// import AdminTopHeader from '../components/admin/AdminTopHeader'; 

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f7f6] text-[#2c3e50]">
            {/* Thay InstructorSidebar bằng AdminSidebar */}
            <AdminSidebar />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {/* <AdminTopHeader /> */}

                <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="mx-auto w-full max-w-[1320px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}