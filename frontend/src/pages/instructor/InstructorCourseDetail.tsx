import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    BadgeInfo,
    BookOpen,
    Bold,
    ChevronDown,
    Code,
    DollarSign,
    FileEdit,
    Image as ImageIcon,
    Info,
    Layers3,
    Link as LinkIcon,
    List,
    Plus,
    Sparkles,
    Trash2,
    Italic,
    UploadCloud,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../api/axios';
import InstructorLayout from '../../layouts/InstructorLayout';

interface CourseForm {
    title: string;
    description: string;
    price: number | string;
    category: string | number;
    hinh_anh: string;
    trang_thai: string;
    file_anh_that?: File | null;
}

interface Lesson {
    id: string | number;
    tieu_de: string;
    thu_tu: number;
    video_url?: string;
}

export default function InstructorCourseDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNewCourse = id === 'new';

    const [formData, setFormData] = useState<CourseForm>({
        title: '',
        description: '',
        price: 0,
        category: 'Web Development',
        hinh_anh: '',
        trang_thai: 'DRAFT',
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [errorText, setErrorText] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);

    useEffect(() => {
        const fetchCourseDetail = async () => {
            if (!isNewCourse) {
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
                    if (courseData.hinh_anh) setImagePreview(courseData.hinh_anh);
                } catch (error) {
                    console.error('Lỗi khi tải thông tin:', error);
                }
            }
        };

        fetchCourseDetail();
    }, [id, isNewCourse]);

    useEffect(() => {
        const fetchLessons = async () => {
            if (!isNewCourse) {
                try {
                    const response: any = await axiosClient.get(`/lessons?id_khoa_hoc=${id}`);
                    const lessonsData = Array.isArray(response.data.data) ? response.data.data : response.data;
                    setLessons(lessonsData.sort((a: Lesson, b: Lesson) => a.thu_tu - b.thu_tu));
                } catch (error) {
                    console.error('Lỗi khi tải bài học:', error);
                }
            }
        };

        fetchLessons();
    }, [id, isNewCourse]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'title') setErrorText('');
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
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài học này?')) return;
        try {
            await axiosClient.delete(`/lessons/${lessonId}`);
            toast.success('Đã xóa bài học thành công!');
            setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
        } catch (error) {
            toast.error('Lỗi khi xóa bài học');
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === 'PENDING' && lessons.length === 0) {
            toast.error('Khóa học này chưa có bài học nào. Vui lòng thêm ít nhất 1 bài học trước khi gửi yêu cầu duyệt.');
            return;
        }

        const confirmMsg =
            newStatus === 'PENDING'
                ? 'Gửi yêu cầu duyệt? Khóa học sẽ bị khóa chỉnh sửa cho đến khi Admin phản hồi.'
                : 'Tạm ngưng xuất bản? Khóa học sẽ bị ẩn khỏi trang chủ để bạn chỉnh sửa.';

        if (!window.confirm(confirmMsg)) return;

        try {
            await axiosClient.patch(`/courses/${id}/status`, { trang_thai: newStatus });
            toast.success('Đã cập nhật trạng thái!');
            setFormData((prev) => ({ ...prev, trang_thai: newStatus }));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
        }
    };

    const isLocked = ['PENDING', 'PUBLISHED'].includes(formData.trang_thai);

    return (
        <InstructorLayout>
            <div className="relative mx-auto w-full max-w-[1320px] space-y-6 px-4 py-6 lg:px-6">
                <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="relative flex flex-col gap-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
                                    <BookOpen size={12} className="text-emerald-600" />
                                    Chi tiết khóa học
                                </div>
                                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
                                    {isNewCourse ? 'Tạo khóa học mới' : formData.title || 'Đang tải...'}
                                </h1>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                                    Thiết lập nội dung, hình ảnh, giá bán và chương trình học theo phong cách Edulyn.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 lg:items-end">
                                <StatusBanner
                                    status={formData.trang_thai}
                                    onAction={() =>
                                        handleStatusChange(formData.trang_thai === 'PENDING' ? 'DRAFT' : 'HIDDEN')
                                    }
                                />

                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={() => navigate('/instructor/courses')}
                                        className="group inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                                        Quay lại
                                    </button>

                                    {!isLocked && (
                                        <>
                                            <button
                                                onClick={handleSave}
                                                className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-800"
                                            >
                                                <Sparkles size={16} />
                                                Lưu bản nháp
                                            </button>

                                            {!isNewCourse && (
                                                <button
                                                    onClick={() => handleStatusChange('PENDING')}
                                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
                                                >
                                                    <BadgeInfo size={18} />
                                                    Gửi yêu cầu duyệt
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
                    <div className="space-y-6">
                        <EdulynCard title="Thông tin cơ bản" icon={<FileEdit size={18} className="text-emerald-600" />}>
                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                                        Tên khóa học <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        disabled={isLocked}
                                        className={`w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white ${isLocked ? 'cursor-not-allowed opacity-60' : ''
                                            }`}
                                        type="text"
                                        placeholder="Nhập tên khóa học"
                                    />
                                    {errorText && <p className="mt-2 text-sm text-red-500">{errorText}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                                        Mô tả khóa học
                                    </label>
                                    <div className={`overflow-hidden rounded-md border border-slate-200 bg-slate-50 ${isLocked ? 'opacity-60' : ''}`}>
                                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
                                            <ToolbarIcon icon={<Bold size={16} />} />
                                            <ToolbarIcon icon={<Italic size={16} />} />
                                            <ToolbarIcon icon={<List size={16} />} />
                                            <ToolbarIcon icon={<LinkIcon size={16} />} />
                                            <ToolbarIcon icon={<Code size={16} />} />
                                        </div>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            disabled={isLocked}
                                            className={`min-h-[240px] w-full resize-none bg-transparent px-4 py-4 text-[15px] leading-7 text-slate-800 outline-none placeholder:text-slate-400 ${isLocked ? 'cursor-not-allowed' : ''
                                                }`}
                                            placeholder="Viết mô tả chi tiết cho khóa học của bạn..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </EdulynCard>

                        <EdulynCard title="Hình ảnh minh họa" icon={<ImageIcon size={18} className="text-emerald-600" />}>
                            <input
                                type="file"
                                id="fileInput"
                                className="hidden"
                                accept="image/*"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setImagePreview(reader.result as string);
                                        reader.readAsDataURL(file);
                                        setFormData({ ...formData, file_anh_that: file });
                                    }
                                }}
                            />

                            {imagePreview || formData.hinh_anh ? (
                                <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                                    <div className="relative aspect-[21/9] overflow-hidden rounded-md bg-black shadow-sm">
                                        <img
                                            src={imagePreview || formData.hinh_anh}
                                            alt="Preview"
                                            className="h-full w-full object-cover opacity-95"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="truncate text-xs italic text-slate-500">
                                            {formData.file_anh_that ? `Đã chọn: ${formData.file_anh_that.name}` : 'Ảnh hiện tại của khóa học'}
                                        </p>
                                        <button
                                            onClick={() => !isLocked && document.getElementById('fileInput')?.click()}
                                            disabled={isLocked}
                                            className={`inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${isLocked ? 'cursor-not-allowed opacity-50' : ''
                                                }`}
                                        >
                                            <UploadCloud size={16} />
                                            Thay đổi ảnh
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => !isLocked && document.getElementById('fileInput')?.click()}
                                    className={`flex min-h-[320px] w-full flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50/30 ${isLocked ? 'cursor-not-allowed opacity-60' : ''
                                        }`}
                                >
                                    <UploadCloud className="mb-4 text-emerald-600" size={34} />
                                    <p className="text-base font-semibold text-slate-800">Nhấn để tải ảnh khóa học lên</p>
                                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Định dạng hỗ trợ: JPG, PNG. Tối đa 5MB.</p>
                                </button>
                            )}
                        </EdulynCard>
                    </div>

                    <div className="space-y-6">
                        <EdulynCard title="Thiết lập" icon={<Layers3 size={18} className="text-emerald-600" />}>
                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                                        Giá khóa học
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
                                        <input
                                            name="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={handleChange}
                                            disabled={isLocked}
                                            className={`w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-[15px] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white ${isLocked ? 'cursor-not-allowed opacity-60' : ''
                                                }`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                                        Danh mục
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            disabled={isLocked}
                                            className={`w-full appearance-none rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white ${isLocked ? 'cursor-not-allowed opacity-60' : ''
                                                }`}
                                        >
                                            <option>Web Development</option>
                                            <option>Data Science</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    </div>
                                </div>
                            </div>
                        </EdulynCard>

                        {!isNewCourse && (
                            <EdulynCard title={`Chương trình học (${lessons.length})`} icon={<BookOpen size={18} className="text-emerald-600" />} sticky>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-sm text-slate-500">Quản lý bài học theo thứ tự.</div>
                                        {!isLocked && (
                                            <button
                                                onClick={() => navigate(`/instructor/lessons/${id}`)}
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700"
                                                title="Thêm bài học mới"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                                        {lessons.length > 0 ? (
                                            lessons.map((lesson, index) => (
                                                <div key={lesson.id} className="rounded-md border border-slate-200 bg-white p-4 transition hover:bg-slate-50/70">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-[11px] font-semibold text-slate-500">
                                                            {String(index + 1).padStart(2, '0')}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-[15px] font-semibold text-slate-800" title={lesson.tieu_de}>
                                                                {lesson.tieu_de}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">{lesson.video_url ? 'Có video' : 'Bài viết'}</p>
                                                        </div>
                                                    </div>

                                                    {!isLocked && (
                                                        <div className="mt-4 flex gap-2">
                                                            <button
                                                                onClick={() => navigate(`/instructor/lesson-detail/${lesson.id}`)}
                                                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                                                            >
                                                                <FileEdit size={14} />
                                                                Sửa
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteLesson(lesson.id)}
                                                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-600 hover:text-white"
                                                            >
                                                                <Trash2 size={14} />
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
                                                    <BookOpen size={22} />
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-slate-800">Chưa có bài học nào</p>
                                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                                    Thêm bài học trước khi gửi duyệt.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </EdulynCard>
                        )}
                    </div>
                </div>
            </div>

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/50 backdrop-blur-sm">
                    <div className="mx-4 w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-lg">
                        <div className="mb-4 flex items-center gap-3 text-red-600">
                            <AlertTriangle size={28} />
                            <h3 className="text-xl font-bold tracking-tight text-slate-800">Cảnh báo xóa khóa học</h3>
                        </div>
                        <p className="mb-6 text-sm leading-6 text-slate-500">Bạn có chắc chắn muốn xóa khóa học này không?</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
                            >
                                Tiếp tục xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </InstructorLayout>
    );
}

function EdulynCard({
    title,
    icon,
    children,
    sticky = false,
}: {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    sticky?: boolean;
}) {
    return (
        <section
            className={`overflow-hidden rounded-md border border-slate-200 bg-white p-5 shadow-sm ${sticky ? 'lg:sticky lg:top-6' : ''
                }`}
        >
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">{icon}</div>
                <h2 className="text-[15px] font-bold tracking-tight text-slate-800">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function ToolbarIcon({ icon }: { icon: ReactNode }) {
    return (
        <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600">
            {icon}
        </button>
    );
}

function StatusBanner({ status, onAction }: { status: string; onAction: () => void }) {
    if (status === 'PENDING') {
        return (
            <div className="inline-flex items-center gap-3 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 shadow-sm">
                <Info size={16} />
                <span>Đang chờ duyệt.</span>
                <button
                    onClick={onAction}
                    className="rounded-md border border-yellow-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-yellow-100"
                >
                    Hủy yêu cầu
                </button>
            </div>
        );
    }

    if (status === 'PUBLISHED') {
        return (
            <div className="inline-flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 shadow-sm">
                <Info size={16} />
                <span>Khóa học đã xuất bản.</span>
                <button
                    onClick={onAction}
                    className="rounded-md border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-green-100"
                >
                    Tạm ẩn
                </button>
            </div>
        );
    }

    return null;
}