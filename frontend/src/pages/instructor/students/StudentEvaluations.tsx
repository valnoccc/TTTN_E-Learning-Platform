import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BookOpen, RefreshCw, Users, Wallet } from 'lucide-react';

import axiosClient from '../../../api/axios';
import ClassicFilterBar from '../../../components/instructor/ClassicFilterBar';
import InstructorLayout from '../../../layouts/InstructorLayout';

type InstructorCourseOption = {
    courseId: number;
    courseName: string;
    coursePrice: number;
    status: string;
    createdAt: string;
};

type InstructorStudentCourse = {
    courseId: number;
    courseName: string;
    coursePrice: number;
    purchasedAt: string;
};

type InstructorStudentSummary = {
    studentId: number;
    studentName: string;
    studentEmail: string;
    totalCourses: number;
    totalSpent: number;
    lastPurchasedAt: string;
    courses: InstructorStudentCourse[];
};

type InstructorStudentBoard = {
    totalStudents: number;
    totalPurchases: number;
    totalRevenue: number;
    students: InstructorStudentSummary[];
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(value: string) {
    if (!value) return 'Chưa cập nhật';
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export default function InstructorStudents() {
    const [courses, setCourses] = useState<InstructorCourseOption[]>([]);
    const [board, setBoard] = useState<InstructorStudentBoard>({
        totalStudents: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        students: [],
    });
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [courseId, setCourseId] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [courseList, studentBoard] = await Promise.all([
                    axiosClient.get<InstructorCourseOption[]>('/instructors/me/courses'),
                    axiosClient.get<InstructorStudentBoard>('/instructors/me/students'),
                ]);

                setCourses(courseList);
                setBoard(studentBoard);
            } finally {
                setLoading(false);
            }
        };

        void loadInitialData();
    }, []);

    const loadStudents = async (nextCourseId = courseId, nextSearch = appliedSearch) => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (nextCourseId) params.courseId = nextCourseId;
            if (nextSearch.trim()) params.search = nextSearch.trim();

            const studentBoard = await axiosClient.get<InstructorStudentBoard>('/instructors/me/students', { params });
            setBoard(studentBoard);
        } finally {
            setLoading(false);
        }
    };

    const selectedCourseName = useMemo(() => {
        if (!courseId) return 'Tất cả khóa học';
        return courses.find((course) => String(course.courseId) === courseId)?.courseName ?? 'Khóa học đã chọn';
    }, [courseId, courses]);

    return (
        <InstructorLayout>
            <div className="space-y-6">
                {/* Header trang */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh sách học viên</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Quản lý và xem danh sách học viên đã đăng ký các khóa học của bạn.
                    </p>
                </div>

                {/* Các thẻ thống kê nhanh */}
                <section className="grid gap-4 md:grid-cols-3">
                    <SummaryCard icon={<Users size={16} />} label="Tổng học viên" value={board.totalStudents} />
                    <SummaryCard icon={<BookOpen size={16} />} label="Lượt mua" value={board.totalPurchases} />
                    <SummaryCard icon={<Wallet size={16} />} label="Doanh thu" value={formatCurrency(board.totalRevenue)} />
                </section>

                {/* Thanh lọc dữ liệu */}
                <ClassicFilterBar
                    searchValue={searchInput}
                    onSearchChange={(event) => setSearchInput(event.target.value)}
                    searchPlaceholder="Tìm kiếm học viên..."
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
                            onClick={() => {
                                setAppliedSearch(searchInput);
                                void loadStudents(courseId, searchInput);
                            }}
                            className="bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            Lọc
                        </button>
                    }
                />

                {/* Danh sách học viên - Dạng bảng truyền thống dễ nhìn */}
                <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
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
                                    <td className="p-4 text-sm font-semibold text-slate-900">{formatCurrency(student.totalSpent)}</td>
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

function MetaBox({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="border border-[#d1d7dc] bg-[#f8fafb] px-4 py-3">
            <dt className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-900">{value}</dd>
        </div>
    );
}
