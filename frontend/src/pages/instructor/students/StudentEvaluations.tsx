import { BookOpen, RefreshCw, Users, Wallet } from 'lucide-react';

import Pagination from '../../../components/Pagination';
import ClassicFilterBar from '../../../components/instructor/ClassicFilterBar';
import InstructorLayout from '../../../layouts/InstructorLayout';
import { useStudentEvaluations } from './hooks/useStudentEvaluations';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export default function StudentEvaluations() {
    const {
        courses,
        board,
        loading,
        searchInput,
        setSearchInput,
        setAppliedSearch,
        courseId,
        setCourseId,
        selectedCourseName,
        loadStudents,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedStudents,
        paginationMeta,
    } = useStudentEvaluations();

    return (
        <InstructorLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            Phân hệ giảng viên
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Đánh giá học viên
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Theo dõi danh sách học viên đã đăng ký các khóa học của bạn.
                        </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                        Đang xem: <span className="font-bold text-slate-900">{selectedCourseName}</span>
                    </div>
                </div>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-500">Tổng học viên</span>
                            <Users size={20} className="text-[#1dbf73]" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                            {board.totalStudents}
                        </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-500">Lượt mua</span>
                            <BookOpen size={20} className="text-[#1dbf73]" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                            {board.totalPurchases}
                        </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-500">Doanh thu khóa học</span>
                            <Wallet size={20} className="text-[#1dbf73]" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                            {formatCurrency(board.totalRevenue)}
                        </p>
                    </div>
                </section>

                <div className="rounded-md border border-slate-200 bg-white p-4">
                    <ClassicFilterBar
                        searchValue={searchInput}
                        onSearchChange={(event) => setSearchInput(event.target.value)}
                        onSearchKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                setAppliedSearch(searchInput);
                                void loadStudents(courseId, searchInput);
                            }
                        }}
                        searchPlaceholder="Tìm theo tên hoặc email học viên..."
                        selectValue={courseId}
                        onSelectChange={(event) => {
                            setCourseId(event.target.value);
                            void loadStudents(event.target.value, searchInput);
                        }}
                        options={[
                            { label: 'Tất cả khóa học', value: '' },
                            ...courses.map((course) => ({
                                label: course.courseName,
                                value: String(course.courseId),
                            })),
                        ]}
                        action={
                            <button
                                type="button"
                                onClick={() => {
                                    setAppliedSearch(searchInput);
                                    void loadStudents(courseId, searchInput);
                                }}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#1dbf73] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#169b5c] lg:w-auto"
                            >
                                <RefreshCw size={14} /> Lọc dữ liệu
                            </button>
                        }
                    />
                </div>

                <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                        <h2 className="text-base font-bold text-slate-800">
                            {board.students.length} học viên trong bộ lọc
                        </h2>
                    </div>

                    {loading ? (
                        <div className="space-y-4 p-6 animate-pulse">
                            <div className="h-10 rounded bg-slate-100" />
                            <div className="h-10 rounded bg-slate-50" />
                            <div className="h-10 rounded bg-slate-50" />
                        </div>
                    ) : board.students.length === 0 ? (
                        <div className="py-16 text-center text-slate-500">
                            Không tìm thấy dữ liệu học viên phù hợp.
                        </div>
                    ) : (
                        <div className="flex min-h-[400px] flex-col justify-between overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70">
                                        <th className="p-4 font-bold text-slate-700">Học viên</th>
                                        <th className="p-4 font-bold text-slate-700">Khóa học tham gia</th>
                                        <th className="p-4 font-bold text-slate-700">Ngày đăng ký</th>
                                        <th className="p-4 text-right font-bold text-slate-700">Học phí</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedStudents.map((student) => (
                                        <tr
                                            key={`${student.studentId}-${student.courseId}`}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">
                                                    {student.studentName}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {student.studentEmail}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-slate-600">
                                                {student.courseName}
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {formatDate(student.purchasedAt)}
                                            </td>
                                            <td className="p-4 text-right font-semibold text-slate-700">
                                                {formatCurrency(student.totalSpent)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {totalPages > 1 && (
                                <div className="mt-auto border-t border-slate-100 bg-white p-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                        variant="numbers"
                                        totalItems={paginationMeta.totalItems}
                                        indexOfFirst={paginationMeta.indexOfFirst}
                                        indexOfLast={paginationMeta.indexOfLast}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </InstructorLayout>
    );
}
