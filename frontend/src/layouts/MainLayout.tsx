import { ReactNode } from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            <Navbar />
            {/* Padding top để không bị che bởi Navbar fixed */}
            <main className="flex-grow pt-12">
                {children}
            </main>
            <Footer />
        </div>
    );
}