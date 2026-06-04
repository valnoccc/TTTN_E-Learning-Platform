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
                <section className="border border-[#d1d7dc] bg-white p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                Quản lý học viên
                            </p>
                            <h1 className="mt-2 text-2xl font-bold text-slate-900">Danh sách học viên</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Giữ nguyên bộ lọc khóa học và tìm kiếm hiện tại, chuyển phần hiển thị sang cấu trúc panel và danh sách có đường kẻ phân tách.
                            </p>
                        </div>

                        <div className="border border-[#d1d7dc] bg-[#f8fafb] px-4 py-3 text-sm text-slate-600">
                            Bộ lọc hiện tại: <span className="font-semibold text-slate-900">{selectedCourseName}</span>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <SummaryCard icon={<Users size={16} />} label="Tổng học viên" value={board.totalStudents} />
                    <SummaryCard icon={<BookOpen size={16} />} label="Lượt mua" value={board.totalPurchases} />
                    <SummaryCard icon={<Wallet size={16} />} label="Doanh thu" value={formatCurrency(board.totalRevenue)} />
                </section>

                <ClassicFilterBar
                    searchValue={searchInput}
                    onSearchChange={(event) => setSearchInput(event.target.value)}
                    onSearchKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            setAppliedSearch(searchInput);
                            void loadStudents(courseId, searchInput);
                        }
                    }}
                    searchPlaceholder="Tìm theo tên hoặc email học viên"
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
                            className="inline-flex w-full items-center justify-center gap-2 border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black lg:w-auto"
                        >
                            <RefreshCw size={16} />
                            Lọc dữ liệu
                        </button>
                    }
                />

                <section className="border border-[#d1d7dc] bg-white">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Kết quả</p>
                        <h2 className="mt-2 text-lg font-bold text-slate-900">
                            {board.students.length} học viên đang hiển thị
                        </h2>
                    </div>

                    {loading ? (
                        <div className="divide-y divide-slate-200">
                            {[1, 2, 3].map((row) => (
                                <div key={row} className="space-y-3 px-5 py-5 animate-pulse">
                                    <div className="h-4 w-48 bg-slate-200" />
                                    <div className="h-3 w-64 bg-slate-100" />
                                    <div className="h-3 w-full bg-slate-100" />
                                </div>
                            ))}
                        </div>
                    ) : board.students.length === 0 ? (
                        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
                            <div className="flex h-14 w-14 items-center justify-center border border-[#d1d7dc] bg-slate-50 text-slate-400">
                                <Users size={22} />
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-slate-900">Không có học viên phù hợp</h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Thử thay đổi từ khóa tìm kiếm hoặc chọn khóa học khác.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {board.students.map((student) => (
                                <article key={student.studentId} className="px-5 py-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 space-y-3">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900">{student.studentName}</h3>
                                                <p className="text-sm text-slate-500">{student.studentEmail}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {student.courses.map((course) => (
                                                    <span
                                                        key={course.courseId}
                                                        className="inline-flex items-center gap-2 border border-[#d1d7dc] bg-[#f8fafb] px-3 py-1.5 text-xs text-slate-700"
                                                    >
                                                        <BookOpen size={12} className="text-emerald-600" />
                                                        {course.courseName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <dl className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                                            <MetaBox label="Số khóa" value={student.totalCourses} />
                                            <MetaBox label="Tổng chi" value={formatCurrency(student.totalSpent)} />
                                            <MetaBox label="Mua gần nhất" value={formatDate(student.lastPurchasedAt)} />
                                        </dl>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
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
