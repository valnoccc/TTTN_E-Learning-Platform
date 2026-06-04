import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ChangeEvent,
    type ReactNode,
} from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    BadgeInfo,
    BookOpen,
    FileEdit,
    Layers3,
    MessageSquare,
    Sparkles,
    Star,
    Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../api/axios';
import InstructorLayout from '../../../layouts/InstructorLayout';

export interface CourseForm {
    title: string;
    description: string;
    price: number | string;
    category: string | number;
    hinh_anh: string;
    trang_thai: string;
    file_anh_that?: File | null;
}

export interface Lesson {
    id: string | number;
    tieu_de: string;
    thu_tu: number;
    video_url?: string;
}

export interface InstructorCourseContextValue {
    id?: string;
    isNewCourse: boolean;
    isLocked: boolean;
    formData: CourseForm;
    errorText: string;
    imagePreview: string | null;
    lessons: Lesson[];
    handleChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSave: () => Promise<void>;
    handleDeleteCourse: () => void;
    confirmDelete: () => Promise<void>;
    setIsDeleteModalOpen: (value: boolean) => void;
    handleImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handleImagePickerOpen: () => void;
    handleDeleteLesson: (lessonId: string | number) => Promise<void>;
    handleStatusChange: (newStatus: string) => Promise<void>;
    navigate: ReturnType<typeof useNavigate>;
}

const InstructorCourseContext = createContext<InstructorCourseContextValue | null>(null);

const detailTabs = [
    { key: 'overview', label: 'Tổng quan', to: 'overview', icon: <FileEdit size={15} /> },
    { key: 'lessons', label: 'Bài học', to: 'lessons', icon: <BookOpen size={15} /> },
    { key: 'reviews', label: 'Đánh giá', to: 'reviews', icon: <Star size={15} /> },
    { key: 'discussions', label: 'Thảo luận', to: 'discussions', icon: <MessageSquare size={15} /> },
] as const;

interface InstructorCourseDetailProps {
    mode?: 'create' | 'edit';
    children?: ReactNode;
}

export default function InstructorCourseDetail({
    mode = 'edit',
    children,
}: InstructorCourseDetailProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNewCourse = mode === 'create';

    const [formData, setFormData] = useState<CourseForm>({
        title: '',
        description: '',
        price: 0,
        category: 'Web Development',
        hinh_anh: '',
        trang_thai: 'DRAFT',
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [errorText, setErrorText] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);

    useEffect(() => {
        if (isNewCourse || !id) {
            setLessons([]);
            return;
        }

        const fetchCourseDetail = async () => {
            try {
                const response: any = await axiosClient.get(`/courses/${id}`);
                const courseData = response.data.data || response.data;
                setFormData({
                    title: courseData.ten_khoa_hoc || '',
                    description: courseData.mo_ta || '',
                    price: courseData.gia || 0,
                    category: courseData.id_danh_muc === 1 ? 'Web Development' : 'Data Science',
                    hinh_anh: courseData.hinh_anh || '',
                    trang_thai: courseData.trang_thai || 'DRAFT',
                });
                setImagePreview(courseData.hinh_anh || null);
            } catch (error) {
                toast.error('Không thể tải thông tin khóa học.');
            }
        };

        const fetchLessons = async () => {
            try {
                const response: any = await axiosClient.get(`/lessons?id_khoa_hoc=${id}`);
                const payload = Array.isArray(response.data.data) ? response.data.data : response.data;
                setLessons(
                    Array.isArray(payload)
                        ? payload.sort((a: Lesson, b: Lesson) => a.thu_tu - b.thu_tu)
                        : [],
                );
            } catch (error) {
                toast.error('Không thể tải danh sách bài học.');
            }
        };

        void fetchCourseDetail();
        void fetchLessons();
    }, [id, isNewCourse]);

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
        if (name === 'title') {
            setErrorText('');
        }
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
        setFormData((current) => ({ ...current, file_anh_that: file }));
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            setErrorText('Tên khóa học không được để trống!');
            return;
        }

        try {
            const data = new FormData();
            data.append('ten_khoa_hoc', formData.title);
            data.append('mo_ta', formData.description);
            data.append('gia', formData.price.toString());
            data.append('id_danh_muc', formData.category === 'Web Development' ? '1' : '2');

            if (formData.file_anh_that) {
                data.append('image', formData.file_anh_that);
            }

            if (isNewCourse) {
                await axiosClient.post('/courses', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Tạo khóa học mới thành công!');
            } else {
                await axiosClient.put(`/courses/${id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Cập nhật thành công!');
            }

            navigate('/instructor/courses');
        } catch (error) {
            toast.error('Lỗi khi lưu khóa học! Hãy kiểm tra dữ liệu.');
        }
    };

    const confirmDelete = async () => {
        if (!id) {
            return;
        }

        setIsDeleteModalOpen(false);
        try {
            await axiosClient.delete(`/courses/${id}`);
            toast.success('Đã xử lý thành công!');
            navigate('/instructor/courses');
        } catch (error) {
            toast.error('Lỗi: Không thể thực hiện yêu cầu!');
        }
    };

    const handleDeleteLesson = async (lessonId: string | number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài học này?')) {
            return;
        }

        try {
            await axiosClient.delete(`/lessons/${lessonId}`);
            toast.success('Đã xóa bài học thành công!');
            setLessons((current) => current.filter((lesson) => lesson.id !== lessonId));
        } catch (error) {
            toast.error('Lỗi khi xóa bài học');
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!id) {
            return;
        }

        if (newStatus === 'PENDING' && lessons.length === 0) {
            toast.error(
                'Khóa học này chưa có bài học nào. Vui lòng thêm ít nhất 1 bài học trước khi gửi yêu cầu duyệt.',
            );
            return;
        }

        const confirmMessage =
            newStatus === 'PENDING'
                ? 'Gửi yêu cầu duyệt? Khóa học sẽ bị khóa chỉnh sửa cho đến khi Admin phản hồi.'
                : newStatus === 'DRAFT'
                    ? 'Hủy yêu cầu duyệt và quay lại bản nháp?'
                    : 'Tạm ngưng xuất bản? Khóa học sẽ bị ẩn khỏi trang chủ để bạn chỉnh sửa.';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await axiosClient.patch(`/courses/${id}/status`, { trang_thai: newStatus });
            toast.success('Đã cập nhật trạng thái!');
            setFormData((current) => ({ ...current, trang_thai: newStatus }));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
        }
    };

    const handleDeleteCourse = () => {
        setIsDeleteModalOpen(true);
    };

    const handleImagePickerOpen = () => {
        document.getElementById('course-image-input')?.click();
    };

    const isLocked = ['PENDING', 'PUBLISHED'].includes(formData.trang_thai);

    const contextValue: InstructorCourseContextValue = {
        id,
        isNewCourse,
        isLocked,
        formData,
        errorText,
        imagePreview,
        lessons,
        handleChange,
        handleSave,
        handleDeleteCourse,
        confirmDelete,
        setIsDeleteModalOpen,
        handleImageChange,
        handleImagePickerOpen,
        handleDeleteLesson,
        handleStatusChange,
        navigate,
    };

    return (
        <InstructorLayout>
            <InstructorCourseContext.Provider value={contextValue}>
                <div className="space-y-6">
                    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">

                        <div className="px-5 py-4 sm:px-6">
                            {/* Nút quay lại gọn gàng ở góc trên */}
                            <button
                                onClick={() => navigate('/instructor/courses')}
                                className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Quay lại danh sách
                            </button>

                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-2 rounded-sm border border-[#1dbf73] bg-[#ebf8f2] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#169b5c]">
                                        <Layers3 size={12} />
                                        Quản lý khóa học
                                    </div>
                                    <h1 className="mt-3 text-2xl font-bold text-slate-900">
                                        {isNewCourse ? 'Tạo khóa học mới' : formData.title || 'Đang tải khóa học'}
                                    </h1>
                                </div>

                                <div className="flex flex-col items-start gap-3 xl:items-end">
                                    {/* Trạng thái Badge */}
                                    {!isNewCourse && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-semibold text-slate-500">Trạng thái:</span>
                                            <BadgeStatus status={formData.trang_thai} />
                                        </div>
                                    )}

                                    {/* Nhóm các nút hành động được thiết kế lại */}
                                    <div className="flex flex-wrap gap-2">
                                        {!isLocked && !isNewCourse ? (
                                            <button
                                                onClick={handleDeleteCourse}
                                                className="inline-flex items-center gap-2 rounded-sm border border-red-500 bg-transparent px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-50"
                                            >
                                                <Trash2 size={16} />
                                                Xóa
                                            </button>
                                        ) : null}

                                        {!isLocked ? (
                                            <button
                                                onClick={() => void handleSave()}
                                                className="inline-flex items-center gap-2 rounded-sm border border-[#1dbf73] bg-transparent px-4 py-2 text-sm font-bold text-[#1dbf73] transition hover:bg-[#ebf8f2]"
                                            >
                                                <Sparkles size={16} />
                                                {isNewCourse ? 'Tạo bản nháp' : 'Lưu bản nháp'}
                                            </button>
                                        ) : null}

                                        {!isLocked && !isNewCourse ? (
                                            <button
                                                onClick={() => void handleStatusChange('PENDING')}
                                                className="inline-flex items-center gap-2 rounded-sm border border-transparent bg-[#1dbf73] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#169b5c]"
                                            >
                                                <BadgeInfo size={16} />
                                                Gửi yêu cầu duyệt
                                            </button>
                                        ) : null}

                                        {/* Nút hành động phụ dựa trên trạng thái */}
                                        <StatusActions status={formData.trang_thai} onAction={() => void handleStatusChange(formData.trang_thai === 'PENDING' ? 'DRAFT' : 'HIDDEN')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!isNewCourse ? (
                            <>

                                {/* SỬA LẠI TABS: Nổi bật hơn, to hơn và viền dày đè lên nét đứt */}
                                <div className="border-b border-slate-200 px-6 bg-white">
                                    <div className="-mb-px flex flex-wrap gap-8">
                                        {detailTabs.map((tab) => (
                                            <NavLink
                                                key={tab.key}
                                                to={tab.to}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-2.5 py-4 px-1 text-base font-bold border-b-[4px] transition-all duration-200 ${isActive
                                                        ? 'border-[#1dbf73] !text-[#1dbf73]' // Tab đang chọn: Viền xanh lục dày, Chữ xanh lục
                                                        : 'border-transparent !text-slate-600 hover:!text-[#169b5c] hover:border-[#169b5c]/40' // Tab bình thường: Chữ xám đậm, Hover hiện viền mờ
                                                    }`
                                                }
                                            >
                                                {/* Thay vì dùng kích thước cố định, để icon kế thừa kích thước (tự động cân đối) */}
                                                <span className="[&>svg]:h-5 [&>svg]:w-5">
                                                    {tab.icon}
                                                </span>
                                                {tab.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:grid-cols-3 sm:px-6">
                                    <CourseMetric label="Trạng thái" value={getStatusLabel(formData.trang_thai)} />
                                    <CourseMetric label="Số bài học" value={String(lessons.length)} />
                                    <CourseMetric
                                        label="Giá bán"
                                        value={
                                            Number(formData.price) > 0
                                                ? `${Number(formData.price).toLocaleString('vi-VN')} đ`
                                                : 'Miễn phí'
                                        }
                                    />
                                </div>
                            </>
                        ) : null}

                        <div className="px-4 py-5 sm:px-6">
                            {isNewCourse ? children : <Outlet />}
                        </div>
                    </section>
                </div>
            </InstructorCourseContext.Provider>

            {/* Modal Xóa */}
            {isDeleteModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
                    <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Xóa khóa học</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Bạn có chắc chắn muốn xóa khóa học này không? Hành động này không thể hoàn tác.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => void confirmDelete()}
                                className="rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                            >
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </InstructorLayout>
    );
}

// ================= COMPONENT PHỤ ================= //

export function useInstructorCourseContext() {
    const context = useContext(InstructorCourseContext);
    if (!context) {
        throw new Error('useInstructorCourseContext must be used within InstructorCourseDetail');
    }
    return context;
}

export function CourseSectionCard({
    title,
    description,
    children,
    action,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <section className="rounded-sm border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                    ) : null}
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

export function CourseSidebarCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-sm border border-slate-200 bg-slate-50/60">
            <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            </div>
            <div className="space-y-4 p-4">{children}</div>
        </section>
    );
}

function CourseMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-sm border border-slate-200 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
        </div>
    );
}

// Badge trạng thái nhỏ gọn
function BadgeStatus({ status }: { status: string }) {
    const baseClass = "inline-flex rounded-sm px-2 py-1 text-[11px] uppercase tracking-wider font-bold border";
    switch (status) {
        case 'PUBLISHED':
            return <span className={`${baseClass} border-green-300 bg-green-50 text-green-700`}>Đã xuất bản</span>;
        case 'PENDING':
            return <span className={`${baseClass} border-yellow-300 bg-yellow-50 text-yellow-700`}>Chờ duyệt</span>;
        case 'HIDDEN':
            return <span className={`${baseClass} border-slate-300 bg-slate-100 text-slate-600`}>Đang ẩn</span>;
        default:
            return <span className={`${baseClass} border-blue-300 bg-blue-50 text-blue-700`}>Bản nháp</span>;
    }
}

// Các nút phụ dựa trên trạng thái (Tạm ẩn, Hủy yêu cầu)
function StatusActions({ status, onAction }: { status: string; onAction: () => void }) {
    if (status === 'PENDING') {
        return (
            <button
                onClick={onAction}
                className="inline-flex items-center gap-2 rounded-sm border border-yellow-500 bg-transparent px-4 py-2 text-sm font-bold text-yellow-600 transition hover:bg-yellow-50"
            >
                Hủy yêu cầu duyệt
            </button>
        );
    }
    if (status === 'PUBLISHED') {
        return (
            <button
                onClick={onAction}
                className="inline-flex items-center gap-2 rounded-sm border border-slate-500 bg-transparent px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
                Tạm ẩn khóa học
            </button>
        );
    }
    return null;
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'PENDING':
            return 'Chờ duyệt';
        case 'PUBLISHED':
            return 'Đã xuất bản';
        case 'HIDDEN':
            return 'Đang ẩn';
        default:
            return 'Bản nháp';
    }
}
