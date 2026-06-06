import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    // Thêm các props tùy chọn để hiển thị dòng chữ thông báo nếu muốn
    totalItems?: number;
    indexOfFirst?: number;
    indexOfLast?: number;
    variant?: 'numbers' | 'simple'; // 'numbers' cho Review, 'simple' cho Bài học
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    indexOfFirst,
    indexOfLast,
    variant = 'numbers'
}: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-transparent w-full">
            {/* Dòng chữ thông báo bên trái */}
            {variant === 'numbers' && totalItems !== undefined && indexOfFirst !== undefined && indexOfLast !== undefined ? (
                <p className="text-xs font-medium text-slate-500">
                    Hiển thị từ <span className="font-semibold text-slate-700">{indexOfFirst + 1}</span> đến{' '}
                    <span className="font-semibold text-slate-700">
                        {indexOfLast > totalItems ? totalItems : indexOfLast}
                    </span>{' '}
                    trong tổng số <span className="font-semibold text-slate-700">{totalItems}</span> mục gốc
                </p>
            ) : (
                <p className="text-sm text-slate-500">
                    Trang {currentPage} / {totalPages} {totalItems !== undefined && `- ${totalItems} mục`}
                </p>
            )}

            {/* Các nút bấm bên phải */}
            <div className="inline-flex gap-1 items-center">
                {/* Nút Trước */}
                <button
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 text-xs font-medium"
                >
                    <ChevronLeft size={16} />
                    {variant === 'simple' && 'Trước'}
                </button>

                {/* Danh sách số (Chỉ hiển thị nếu variant là 'numbers') */}
                {variant === 'numbers' &&
                    [...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`px-3 py-1 text-xs font-bold rounded border transition ${currentPage === pageNum
                                        ? 'bg-[#1dbf73] border-[#1dbf73] text-white shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                {/* Nút Sau */}
                <button
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 text-xs font-medium"
                >
                    {variant === 'simple' && 'Sau'}
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}