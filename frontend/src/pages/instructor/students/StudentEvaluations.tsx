import { Users, BookOpen, Wallet, RefreshCw, Code, FileEdit, CheckCircle, XCircle } from 'lucide-react';
import InstructorLayout from '../../../layouts/InstructorLayout';
import ClassicFilterBar from '../../../components/instructor/ClassicFilterBar';
// Nhớ kiểm tra lại đường dẫn import Pagination cho đúng với dự án của bạn nhé:
import Pagination from '../../../components/Pagination';
import { useStudentEvaluations, type SubmissionStatus, type StudentSubmissionSummary } from './hooks/useStudentEvaluations';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
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
        statusFilter,
        setStatusFilter,
        selectedCourseName,
        loadStudents,

        // THÊM: Các state phân trang
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedStudents,
        paginationMeta,

        // Modal states & actions
        selectedStudent,
        scoreInput,
        setScoreInput,
        feedbackInput,
        setFeedbackInput,
        isSaving,
        handleOpenGradeModal,
        handleCloseGradeModal,
        handleSaveEvaluation
    } = useStudentEvaluations();

    return (
        <InstructorLayout>
            <div className="space-y-6">

                {/* Header Tiêu đề */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            Phân hệ giảng viên
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">Đánh giá học viên</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Rà soát mã nguồn GitHub bài nộp cuối khóa để đánh giá năng lực hoàn thành của học viên.
                        </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                        Đang xem: <span className="font-bold text-slate-900">{selectedCourseName}</span>
                    </div>
                </div>

                {/* Thẻ Thống kê Tương phản */}
                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-500">Tổng học viên</span>
                            <Users size={20} className="text-[#1dbf73]" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{board.totalStudents}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-500">Lượt mua</span>
                            <BookOpen size={20} className="text-[#1dbf73]" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{board.totalPurchases}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-500">Doanh thu khóa học</span>
                            <Wallet size={20} className="text-[#1dbf73]" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(board.totalRevenue)}</p>
                    </div>
                </section>

                {/* Ô chọn trạng thái bài làm được đưa vào chung và căn phải */}
                <div className="flex items-center lg:mt-0 justify-end">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            void loadStudents(courseId, searchInput, e.target.value);
                        }}
                        // Đã hạ xuống py-2 và text-xs font-semibold để đồng bộ kích thước gọn gàng
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#1dbf73]"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="NOT_SUBMITTED">Chưa nộp bài</option>
                        <option value="PENDING">Chờ chấm bài</option>
                        <option value="PASSED">Đã đạt yêu cầu</option>
                        <option value="FAILED">Cần chỉnh sửa lại</option>
                    </select>
                </div>

                {/* Khu Vực Lọc và Tìm Kiếm Tổng Hợp */}
                <div className="bg-white p-4 rounded-md border border-slate-200">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        {/* Thanh tìm kiếm và ô chọn khóa học bên trái */}
                        <div className="flex-1">
                            <ClassicFilterBar
                                searchValue={searchInput}
                                onSearchChange={(event) => setSearchInput(event.target.value)}
                                onSearchKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        setAppliedSearch(searchInput);
                                        void loadStudents(courseId, searchInput, statusFilter);
                                    }
                                }}
                                searchPlaceholder="Tìm theo tên hoặc email học viên..."
                                selectValue={courseId}
                                onSelectChange={(event) => {
                                    setCourseId(event.target.value);
                                    void loadStudents(event.target.value, searchInput, statusFilter);
                                }}
                                options={[
                                    { label: 'Tất cả khóa học', value: '' },
                                    ...courses.map((course) => ({
                                        label: course.courseName,
                                        value: String(course.courseId),
                                    })),
                                ]}
                                // Nút lọc đã được thu nhỏ py-2 và text-xs để bằng ô nhập liệu
                                action={
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAppliedSearch(searchInput);
                                            void loadStudents(courseId, searchInput, statusFilter);
                                        }}
                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#1dbf73] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#169b5c] lg:w-auto"
                                    >
                                        <RefreshCw size={14} /> Lọc dữ liệu
                                    </button>
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Bảng Hiển Thị Dữ Liệu Học Viên */}
                <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                        <h2 className="text-base font-bold text-slate-800">{board.students.length} học viên trong bộ lọc</h2>
                    </div>

                    {loading ? (
                        <div className="p-6 space-y-4 animate-pulse">
                            <div className="h-10 bg-slate-100 rounded" />
                            <div className="h-10 bg-slate-50 rounded" />
                            <div className="h-10 bg-slate-50 rounded" />
                        </div>
                    ) : board.students.length === 0 ? (
                        <div className="py-16 text-center text-slate-500">Không tìm thấy dữ liệu học viên phù hợp.</div>
                    ) : (
                        <div className="overflow-x-auto flex flex-col justify-between min-h-[400px]">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70">
                                        <th className="p-4 font-bold text-slate-700">Học viên</th>
                                        <th className="p-4 font-bold text-slate-700">Khóa học tham gia</th>
                                        <th className="p-4 font-bold text-slate-700">Trạng thái bài làm</th>
                                        <th className="p-4 font-bold text-slate-700">Kho lưu trữ (GitHub)</th>
                                        <th className="p-4 font-bold text-slate-700 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {/* ĐÃ SỬA: Map qua paginatedStudents thay vì board.students */}
                                    {paginatedStudents.map((student) => (
                                        <tr key={`${student.studentId}-${student.courseId}`} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{student.studentName}</div>
                                                <div className="text-xs text-slate-500">{student.studentEmail}</div>
                                            </td>
                                            <td className="p-4 text-slate-600 font-medium">{student.courseName}</td>
                                            <td className="p-4">
                                                <StatusBadge status={student.status} />
                                            </td>
                                            <td className="p-4">
                                                {student.githubLink ? (
                                                    <a
                                                        href={student.githubLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-[#1dbf73] underline decoration-slate-300 hover:decoration-[#1dbf73]"
                                                    >
                                                        <Code size={14} /> Xem kho code
                                                    </a>
                                                ) : (
                                                    <span className="text-xs italic text-slate-400">Chưa cập nhật liên kết</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {student.githubLink ? (
                                                    <button
                                                        onClick={() => handleOpenGradeModal(student)}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-[#1dbf73] bg-white px-3 py-1.5 text-xs font-bold text-[#169b5c] transition hover:bg-[#ebf8f2]"
                                                    >
                                                        <FileEdit size={14} /> Chấm điểm
                                                    </button>
                                                ) : (
                                                    <button disabled className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
                                                        Chờ nộp bài
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* THÊM: Component Phân Trang */}
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-slate-100 mt-auto bg-white">
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

                {/* MODAL CHẤM BÀI PHÂN HỆ GIẢNG VIÊN */}
                {selectedStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                        <div className="w-full max-w-lg rounded-md bg-white p-6 shadow-xl border border-slate-100">
                            <div className="border-b border-slate-100 pb-3 mb-4">
                                <h3 className="text-lg font-bold text-slate-900">Đánh giá đồ án cuối khóa</h3>
                                <p className="text-xs text-slate-500 mt-1">Học viên: <span className="font-bold text-slate-700">{selectedStudent.studentName}</span></p>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-md bg-slate-50 p-3 border border-slate-200/60 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Liên kết dự án</span>
                                    <a href={selectedStudent.githubLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline">
                                        <Code size={14} /> Mở tab GitHub mới
                                    </a>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Thang điểm hệ 10</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={scoreInput}
                                        onChange={(e) => setScoreInput(e.target.value)}
                                        placeholder="Nhập điểm số (Ví dụ: 8.5)"
                                        className="w-full rounded-md border border-slate-200 px-3 py-2.5 outline-none transition focus:border-[#1dbf73]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nhận xét chi tiết mã nguồn</label>
                                    <textarea
                                        rows={4}
                                        value={feedbackInput}
                                        onChange={(e) => setFeedbackInput(e.target.value)}
                                        placeholder="Ghi nhận xét về cấu trúc thư mục NestJS, giải thuật hoặc UI Component của học viên..."
                                        className="w-full resize-none rounded-md border border-slate-200 px-3 py-2.5 outline-none transition focus:border-[#1dbf73]"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                                <button
                                    onClick={handleCloseGradeModal}
                                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Đóng lại
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        disabled={isSaving}
                                        onClick={() => void handleSaveEvaluation('FAILED')}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                                    >
                                        <XCircle size={16} /> Chưa đạt
                                    </button>
                                    <button
                                        disabled={isSaving}
                                        onClick={() => void handleSaveEvaluation('PASSED')}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-[#1dbf73] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#169b5c]"
                                    >
                                        <CheckCircle size={16} /> Đạt yêu cầu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </InstructorLayout>
    );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
    const baseClass = "inline-flex rounded-md px-2.5 py-1 text-xs font-bold border";
    switch (status) {
        case 'PASSED':
            return <span className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700`}>Đã đạt yêu cầu</span>;
        case 'FAILED':
            return <span className={`${baseClass} border-red-200 bg-red-50 text-red-700`}>Yêu cầu sửa đổi</span>;
        case 'PENDING':
            return <span className={`${baseClass} border-amber-200 bg-amber-50 text-amber-700`}>Chờ chấm bài</span>;
        default:
            return <span className={`${baseClass} border-slate-200 bg-slate-100 text-slate-500`}>Chưa nộp bài</span>;
    }
}