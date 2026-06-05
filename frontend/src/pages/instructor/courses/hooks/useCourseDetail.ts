import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export interface CourseForm {
    title: string;
    description: string;
    price: number | string;
    category: string | number;
    hinh_anh: string;
    trang_thai: string;
    hinh_thu_nho?: string | null;
}

export interface Lesson {
    id: string | number;
    tieu_de: string;
    thu_tu: number;
    video_url?: string;
}

interface CourseDetailApiData {
    ten_khoa_hoc?: string;
    mo_ta?: string;
    gia?: number;
    id_danh_muc?: number;
    hinh_thu_nho?: string | null;
    hinh_anh?: string | null;
    trang_thai?: string;
}

interface CourseDetailApiResponse {
    message?: string;
    data?: CourseDetailApiData;
}

interface LessonListApiResponse {
    message?: string;
    data?: Lesson[];
}

export interface InstructorCourseContextValue {
    id?: string;
    isNewCourse: boolean;
    isLocked: boolean;
    formData: CourseForm;
    errorText: string;
    imagePreview: string | null;
    lessons: Lesson[];
    isDeleteModalOpen: boolean;
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

interface UseCourseDetailOptions {
    mode?: 'create' | 'edit';
}

export function useCourseDetail(
    { mode = 'edit' }: UseCourseDetailOptions = {},
): InstructorCourseContextValue {
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
    const [imageFile, setImageFile] = useState<File | null>(null);
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
                const response = await axiosClient.get<CourseDetailApiResponse>(
                    `/courses/${id}`,
                );
                const courseData = response.data ?? {};

                setFormData({
                    title: courseData.ten_khoa_hoc || '',
                    description: courseData.mo_ta || '',
                    price: courseData.gia || 0,
                    category: courseData.id_danh_muc === 1 ? 'Web Development' : 'Data Science',
                    hinh_anh: courseData.hinh_thu_nho || courseData.hinh_anh || '',
                    trang_thai: courseData.trang_thai || 'DRAFT',
                    hinh_thu_nho: courseData.hinh_thu_nho || null,
                });
                setImagePreview(courseData.hinh_thu_nho || courseData.hinh_anh || null);
                setImageFile(null);
            } catch {
                toast.error('Không thể tải thông tin khóa học.');
            }
        };

        const fetchLessons = async () => {
            try {
                const response = await axiosClient.get<LessonListApiResponse | Lesson[]>(
                    `/lessons?id_khoa_hoc=${id}`,
                );
                const payload = Array.isArray(response) ? response : response.data ?? [];

                setLessons(
                    Array.isArray(payload)
                        ? payload.sort((a, b) => a.thu_tu - b.thu_tu)
                        : [],
                );
            } catch {
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
        setImageFile(file);
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

            if (imageFile) {
                data.append('image', imageFile);
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
        } catch {
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
        } catch {
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
        } catch {
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
        } catch (error: unknown) {
            const message =
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
                    'string'
                    ? (error as { response: { data: { message: string } } }).response.data.message
                    : 'Lỗi khi cập nhật trạng thái';
            toast.error(message);
        }
    };

    const handleDeleteCourse = () => {
        setIsDeleteModalOpen(true);
    };

    const handleImagePickerOpen = () => {
        document.getElementById('course-image-input')?.click();
    };

    const isLocked = ['PENDING', 'PUBLISHED'].includes(formData.trang_thai);

    return {
        id,
        isNewCourse,
        isLocked,
        formData,
        errorText,
        imagePreview,
        lessons,
        isDeleteModalOpen,
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
}
