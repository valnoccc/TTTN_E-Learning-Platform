import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Search, BookOpen, Users, Wallet, Clock3, RefreshCw } from 'lucide-react';
import InstructorLayout from '../../layouts/InstructorLayout';
import axiosClient from '../../api/axios';

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

    loadInitialData();
  }, []);

  const loadStudents = async (nextCourseId = courseId, nextSearch = appliedSearch) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};

      if (nextCourseId) {
        params.courseId = nextCourseId;
      }

      if (nextSearch.trim()) {
        params.search = nextSearch.trim();
      }

      const studentBoard = await axiosClient.get<InstructorStudentBoard>('/instructors/me/students', {
        params,
      });

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
      <div className="relative space-y-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(0,113,227,0.12),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(29,29,31,0.06),_transparent_30%),linear-gradient(to_bottom,_rgba(255,255,255,0.95),_transparent)]" />

        <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="absolute inset-y-0 right-0 hidden w-72 bg-[radial-gradient(circle,_rgba(0,113,227,0.12),_transparent_70%)] lg:block" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                <Users size={12} className="text-[#0071E3]" />
                Quản lý học viên
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#1D1D1F] sm:text-4xl">
                Học viên đã mua khóa học của bạn
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                Theo dõi danh sách học viên, xem họ đã mua khóa nào và lọc nhanh theo từng khóa học hoặc từ khóa.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
              <StatCard icon={<Users size={16} />} label="Học viên" value={board.totalStudents} />
              <StatCard icon={<BookOpen size={16} />} label="Lượt mua" value={board.totalPurchases} />
              <StatCard icon={<Wallet size={16} />} label="Doanh thu" value={formatCurrency(board.totalRevenue)} wide />
              <StatCard icon={<Clock3 size={16} />} label="Bộ lọc" value={selectedCourseName} wide />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)_auto]">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 transition focus-within:border-[#0071E3] focus-within:bg-white">
              <Search size={16} className="text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setAppliedSearch(searchInput);
                    void loadStudents(courseId, searchInput);
                  }
                }}
                placeholder="Tìm theo tên hoặc email học viên"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:bg-white"
            >
              <option value="">Tất cả khóa học</option>
              {courses.map((course) => (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseName}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setAppliedSearch(searchInput);
                void loadStudents(courseId, searchInput);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1D1D1F] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_30px_rgba(29,29,31,0.16)] transition hover:bg-black"
            >
              <RefreshCw size={16} />
              Lọc dữ liệu
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Danh sách học viên
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {board.students.length} học viên đang hiển thị theo bộ lọc hiện tại.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              <Clock3 size={12} className="text-slate-400" />
              {selectedCourseName}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((row) => (
                <div key={row} className="rounded-[24px] border border-slate-100 bg-slate-50/60 p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200/80" />
                      <div className="space-y-2">
                        <div className="h-4 w-44 animate-pulse rounded-full bg-slate-200/80" />
                        <div className="h-3 w-56 animate-pulse rounded-full bg-slate-200/70" />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                      <div className="h-16 animate-pulse rounded-2xl bg-slate-200/70" />
                      <div className="h-16 animate-pulse rounded-2xl bg-slate-200/70" />
                      <div className="h-16 animate-pulse rounded-2xl bg-slate-200/70" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-8 w-28 animate-pulse rounded-full bg-slate-200/70" />
                    <div className="h-8 w-36 animate-pulse rounded-full bg-slate-200/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : board.students.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <Users size={28} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#1D1D1F]">Chưa có học viên phù hợp</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Thử đổi bộ lọc hoặc chờ thêm học viên mua khóa học của bạn.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {board.students.map((student) => (
                <article key={student.studentId} className="p-6 transition hover:bg-slate-50/60">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#111827,_#374151)] text-sm font-semibold text-white shadow-sm">
                          {getStudentInitials(student.studentName)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-[#1D1D1F]">{student.studentName}</h3>
                          <p className="truncate text-sm text-slate-500">{student.studentEmail}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {student.courses.map((course) => (
                          <span
                            key={course.courseId}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-[0_1px_0_rgba(15,23,42,0.02)]"
                          >
                            <BookOpen size={12} className="text-[#0071E3]" />
                            {course.courseName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[380px]">
                      <MetaCard label="Số khóa" value={student.totalCourses} />
                      <MetaCard label="Tổng chi" value={formatCurrency(student.totalSpent)} />
                      <MetaCard label="Mua gần nhất" value={formatDate(student.lastPurchasedAt)} />
                    </div>
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

function getStudentInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function StatCard({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] ${wide ? 'sm:col-span-2' : ''
        }`}
    >
      <div className="flex items-center justify-between text-slate-400">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-[#0071E3]">
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      </div>
      <div className="mt-3 text-lg font-semibold tracking-tight text-[#1D1D1F]">{value}</div>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[#1D1D1F]">{value}</div>
    </div>
  );
}
