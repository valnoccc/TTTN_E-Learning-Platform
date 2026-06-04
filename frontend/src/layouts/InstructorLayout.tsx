import { type ReactNode } from 'react';

import InstructorSidebar from '../components/common/InstructorSidebar';
import InstructorTopHeader from '../components/instructor/InstructorTopHeader';

interface InstructorLayoutProps {
  children: ReactNode;
}

export default function InstructorLayout({ children }: InstructorLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] text-[#2c3e50]">
      <InstructorSidebar />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <InstructorTopHeader />

        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
