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
    muc_tieu: string[]; // ĐÃ THÊM
    yeu_cau: string[];  // ĐÃ THÊM
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
    giaBan?: number;
    gia?: number;
    id_danh_muc?: number;
    hinh_thu_nho?: string | null;
    hinh_anh?: string | null;
    trang_thai?: string;
    muc_tieu?: string[]; // ĐÃ THÊM
    yeu_cau?: string[];  // ĐÃ THÊM
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
    isSaving: boolean;
    isStatusChanging: boolean;

    // CÁC HÀM XỬ LÝ MỤC TIÊU/YÊU CẦU ĐƯỢC XUẤT RA GIAO DIỆN
    updateObjective: (index: number, value: string) => void;
    removeObjective: (index: number) => void;
    addObjective: () => void;
    updateRequirement: (index: number, value: string) => void;
    removeRequirement: (index: number) => void;
    addRequirement: () => void;
}

interface UseCourseDetailOptions {
    mode?: 'create' | 'edit';
}

const COURSE_TITLE_MAX_LENGTH = 60;

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
        category: '',
        hinh_anh: '',
        trang_thai: 'DRAFT',
        // ĐÃ KHỞI TẠO MẢNG MẶC ĐỊNH ĐỂ GIAO DIỆN KHÔNG BỊ TRỐNG
        muc_tieu: ['', '', '', ''],
        yeu_cau: [''],
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [errorText, setErrorText] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isStatusChanging, setIsStatusChanging] = useState(false);

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
                    price: courseData.giaBan ?? courseData.gia ?? 0,
                    category: courseData.id_danh_muc ?? '',
                    hinh_anh: courseData.hinh_thu_nho || courseData.hinh_anh || '',
                    trang_thai: courseData.trang_thai || 'DRAFT',
                    hinh_thu_nho: courseData.hinh_thu_nho || null,
                    // ĐỒNG BỘ DỮ LIỆU MỤC TIÊU & YÊU CẦU TỪ DATABASE
                    muc_tieu: courseData.muc_tieu?.length ? courseData.muc_tieu : ['', '', '', ''],
                    yeu_cau: courseData.yeu_cau?.length ? courseData.yeu_cau : [''],
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

    // ==========================================
    // LOGIC THAO TÁC MỤC TIÊU KHÓA HỌC
    // ==========================================
    const updateObjective = (index: number, value: string) => {
        setFormData(prev => {
            const newObj = [...(prev.muc_tieu || [])];
            newObj[index] = value;
            return { ...prev, muc_tieu: newObj };
        });
    };

    const removeObjective = (index: number) => {
        setFormData(prev => {
            const currentObj = prev.muc_tieu || [];
            if (currentObj.length <= 1) return prev;
            return { ...prev, muc_tieu: currentObj.filter((_, i) => i !== index) };
        });
    };

    const addObjective = () => {
        setFormData(prev => ({ ...prev, muc_tieu: [...(prev.muc_tieu || []), ''] }));
    };

    // ==========================================
    // LOGIC THAO TÁC YÊU CẦU KHÓA HỌC
    // ==========================================
    const updateRequirement = (index: number, value: string) => {
        setFormData(prev => {
            const newReq = [...(prev.yeu_cau || [])];
            newReq[index] = value;
            return { ...prev, yeu_cau: newReq };
        });
    };

    const removeRequirement = (index: number) => {
        setFormData(prev => {
            const currentReq = prev.yeu_cau || [];
            if (currentReq.length <= 1) return prev;
            return { ...prev, yeu_cau: currentReq.filter((_, i) => i !== index) };
        });
    };

    const addRequirement = () => {
        setFormData(prev => ({ ...prev, yeu_cau: [...(prev.yeu_cau || []), ''] }));
    };


    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
        setErrorText('');
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
        setImageFile(file);
    };

    const handleSave = async () => {
        const trimmedTitle = formData.title.trim();
        const selectedCategory = Number(formData.category);
        const coursePrice = Number(formData.price);

        if (!trimmedTitle) {
            setErrorText('Tên khóa học không được để trống!');
            toast.error('Vui lòng kiểm tra lại thông tin cơ bản!');
            navigate(`/instructor/courses/${id || 'new'}/overview`);
            return;
        }
        if (trimmedTitle.length > COURSE_TITLE_MAX_LENGTH) {
            setErrorText(`Tên khóa học không được vượt quá ${COURSE_TITLE_MAX_LENGTH} ký tự!`);
            toast.error('Vui lòng kiểm tra lại thông tin cơ bản!');
            navigate(`/instructor/courses/${id || 'new'}/overview`);
            return;
        }
        if (!Number.isFinite(selectedCategory) || selectedCategory <= 0) {
            setErrorText('Vui lòng chọn danh mục khóa học!');
            toast.error('Vui lòng chọn danh mục khóa học!');
            navigate(`/instructor/courses/${id || 'new'}/overview`);
            return;
        }
        if (!Number.isFinite(coursePrice) || coursePrice < 0) {
            setErrorText('Giá khóa học không hợp lệ!');
            toast.error('Giá khóa học không hợp lệ!');
            navigate(`/instructor/courses/${id || 'new'}/overview`);
            return;
        }

        try {
            setIsSaving(true);
            const data = new FormData();
            data.append('ten_khoa_hoc', trimmedTitle);
            data.append('mo_ta', formData.description);
            data.append('giaBan', coursePrice.toString());
            data.append('gia', coursePrice.toString());
            data.append('id_danh_muc', String(selectedCategory));

            // Gắn mảng Mục tiêu và Yêu cầu vào request dưới dạng JSON string
            data.append('muc_tieu', JSON.stringify((formData.muc_tieu || []).filter(Boolean)));
            data.append('yeu_cau', JSON.stringify((formData.yeu_cau || []).filter(Boolean)));

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
            toast.error('Lỗi khi lưu thông tin. Vui lòng thử lại!');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!id) return;
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
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài học này?')) return;
        try {
            await axiosClient.delete(`/lessons/${lessonId}`);
            toast.success('Đã xóa bài học thành công!');
            setLessons((current) => current.filter((lesson) => lesson.id !== lessonId));
        } catch {
            toast.error('Lỗi khi xóa bài học');
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        console.log('[handleStatusChange] Đã click đổi trạng thái sang:', newStatus);
        if (!id) {
            console.log('[handleStatusChange] LỖI: Không tìm thấy ID khóa học!');
            return;
        }

        // 1. KIỂM TRA RÀNG BUỘC DỮ LIỆU TRƯỚC KHI LƯU VÀ GỬI DUYỆT
        console.log('[handleStatusChange] Đang kiểm tra dữ liệu formData...', formData);
        const trimmedTitle = formData.title.trim();
        const selectedCategory = Number(formData.category);
        const coursePrice = Number(formData.price);
        if (!trimmedTitle) {
            console.log('[handleStatusChange] LỖI: Tên khóa học trống');
            toast.error('Tên khóa học không được để trống!');
            navigate(`/instructor/courses/${id}/overview`);
            return;
        }
        if (trimmedTitle.length > COURSE_TITLE_MAX_LENGTH) {
            console.log('[handleStatusChange] LỖI: Tên khóa học quá dài');
            toast.error(`Tên khóa học không được vượt quá ${COURSE_TITLE_MAX_LENGTH} ký tự!`);
            navigate(`/instructor/courses/${id}/overview`);
            return;
        }
        if (!Number.isFinite(selectedCategory) || selectedCategory <= 0) {
            console.log('[handleStatusChange] LỖI: Chưa chọn danh mục');
            toast.error('Vui lòng chọn danh mục khóa học!');
            navigate(`/instructor/courses/${id}/overview`);
            return;
        }
        if (!Number.isFinite(coursePrice) || coursePrice < 0) {
            console.log('[handleStatusChange] LỖI: Giá không hợp lệ');
            toast.error('Giá khóa học không hợp lệ!');
            navigate(`/instructor/courses/${id}/overview`);
            return;
        }

        if (newStatus === 'PENDING' && lessons.length === 0) {
            console.log('[handleStatusChange] LỖI: Khóa học chưa có bài học');
            toast.error('Khóa học này chưa có bài học nào. Vui lòng thêm ít nhất 1 bài học trước khi gửi yêu cầu duyệt.');
            return;
        }

        console.log('[handleStatusChange] Đã qua bước kiểm tra dữ liệu. Bắt đầu gọi API...');
        try {
            setIsStatusChanging(true);
            // 2. AUTO-SAVE: TỰ ĐỘNG LƯU TOÀN BỘ NỘI DUNG MỚI TRƯỚC KHI ĐỔI TRẠNG THÁI
            const data = new FormData();
            data.append('ten_khoa_hoc', trimmedTitle);
            data.append('mo_ta', formData.description);
            data.append('giaBan', coursePrice.toString());
            data.append('gia', coursePrice.toString());
            data.append('id_danh_muc', String(selectedCategory));
            data.append('muc_tieu', JSON.stringify((formData.muc_tieu || []).filter(Boolean)));
            data.append('yeu_cau', JSON.stringify((formData.yeu_cau || []).filter(Boolean)));
            if (imageFile) {
                data.append('image', imageFile);
            }

            console.log('[handleStatusChange] Gọi API PUT /courses/' + id);
            // Gọi API lưu dữ liệu (PUT)
            await axiosClient.put(`/courses/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log('[handleStatusChange] Gọi API PATCH /courses/' + id + '/status');
            // 3. NẾU LƯU DỮ LIỆU THÀNH CÔNG -> GỌI API CẬP NHẬT TRẠNG THÁI (PATCH)
            await axiosClient.patch(`/courses/${id}/status`, { trang_thai: newStatus });

            console.log('[handleStatusChange] THÀNH CÔNG!');
            toast.success('Đã lưu lại nội dung và cập nhật trạng thái mới!');
            setFormData((current) => ({ ...current, trang_thai: newStatus }));

        } catch (error: unknown) {
            console.error('[handleStatusChange] CATCH LỖI:', error);
            // Bắt lỗi nếu quá trình lưu hoặc đổi trạng thái thất bại
            const message = typeof error === 'object' && error !== null && 'response' in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
                ? (error as { response: { data: { message: string } } }).response.data.message
                : 'Lỗi khi xử lý yêu cầu. Vui lòng kiểm tra lại!';
            toast.error(message);
        } finally {
            setIsStatusChanging(false);
        }
    };

    const handleDeleteCourse = () => setIsDeleteModalOpen(true);
    const handleImagePickerOpen = () => document.getElementById('course-image-input')?.click();

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
        isSaving,
        isStatusChanging,

        // XUẤT CÁC HÀM NÀY RA ĐỂ GIAO DIỆN CÓ THỂ SỬ DỤNG
        updateObjective,
        removeObjective,
        addObjective,
        updateRequirement,
        removeRequirement,
        addRequirement
    };
}
