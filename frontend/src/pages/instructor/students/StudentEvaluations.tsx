import { BookOpen, Users, Wallet, type ReactNode } from 'lucide-react';

import ClassicFilterBar from '../../../components/instructor/ClassicFilterBar';
import InstructorLayout from '../../../layouts/InstructorLayout';
import { useStudentBoard } from './hooks/useStudentBoard';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function InstructorStudents() {
    const {
        applyFilters,
        board,
        courseId,
        courses,
        loading,
        searchInput,
        selectedCourseName,
        setCourseId,
        setSearchInput,
    } = useStudentBoard();

    return (
        <InstructorLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh sách học viên</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Quản lý và xem danh sách học viên đã đăng ký các khóa học của bạn.
                    </p>
                </div>

                <section className="grid gap-4 md:grid-cols-3">
                    <SummaryCard icon={<Users size={16} />} label="Tổng học viên" value={board.totalStudents} />
                    <SummaryCard icon={<BookOpen size={16} />} label="Lượt mua" value={board.totalPurchases} />
                    <SummaryCard icon={<Wallet size={16} />} label="Doanh thu" value={formatCurrency(board.totalRevenue)} />
                </section>

                <ClassicFilterBar
                    searchValue={searchInput}
                    onSearchChange={(event) => setSearchInput(event.target.value)}
                    searchPlaceholder={`Tìm kiếm học viên trong ${selectedCourseName.toLowerCase()}...`}
                    selectValue={courseId}
                    onSelectChange={(event) => setCourseId(event.target.value)}
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
                            onClick={applyFilters}
                            disabled={loading}
                            className="bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang lọc...' : 'Lọc'}
                        </button>
                    }
                />

                <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="p-4 text-sm font-bold text-slate-700">Học viên</th>
                                <th className="p-4 text-sm font-bold text-slate-700">Số khóa học</th>
                                <th className="p-4 text-sm font-bold text-slate-700">Tổng chi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {board.students.map((student) => (
                                <tr key={student.studentId} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-900">{student.studentName}</p>
                                        <p className="text-xs text-slate-500">{student.studentEmail}</p>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">{student.totalCourses}</td>
                                    <td className="p-4 text-sm font-semibold text-slate-900">
                                        {formatCurrency(student.totalSpent)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </InstructorLayout>
    );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
    return (
        <div className="border border-[#d1d7dc] bg-white p-4">
            <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center border border-[#d1d7dc] bg-[#f8fafb] text-emerald-600">
                    {icon}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}
