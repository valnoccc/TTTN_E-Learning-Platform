import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export interface LessonForm {
    tieu_de: string;
    noi_dung: string;
    thu_tu: number | string;
    id_khoa_hoc?: string | number | null;
    video_url?: string;
    video_file: File | null;
}

interface LessonApiData {
    tieu_de?: string;
    noi_dung?: string;
    thu_tu?: number;
    id_khoa_hoc?: string | number | null;
    video_url?: string;
}

interface LessonApiResponse {
    data?: LessonApiData;
    message?: string;
}

export function useLessonCreateForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState<LessonForm>({
        tieu_de: '',
        noi_dung: '',
        thu_tu: 1,
        video_file: null,
    });

    const handleChange = (field: keyof LessonForm, value: LessonForm[keyof LessonForm]) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setFormData((current) => ({ ...current, video_file: file }));
        setVideoPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!formData.tieu_de.trim()) {
            toast.error('Vui lòng nhập tiêu đề bài học');
            return;
        }

        setLoading(true);
        const data = new FormData();
        if (id) {
            data.append('id_khoa_hoc', id);
        }
        data.append('tieu_de', formData.tieu_de);
        data.append('noi_dung', formData.noi_dung);
        data.append('thu_tu', formData.thu_tu.toString());
        if (formData.video_file) {
            data.append('video', formData.video_file);
        }

        try {
            await axiosClient.post('/lessons', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Thêm bài học thành công!');
            navigate(`/instructor/courses/${id}`);
        } catch (error: unknown) {
            const message =
                typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
                    'string'
                    ? (error as { response: { data: { message: string } } }).response.data.message
                    : 'Lỗi khi tải bài học lên hệ thống';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        navigate,
        videoPreview,
        handleChange,
        handleFileChange,
        handleSave,
    };
}

export function useLessonDetailForm() {
    const { lessonId, id } = useParams<{ lessonId?: string; id?: string }>();
    const targetId = lessonId || id;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState<LessonForm>({
        tieu_de: '',
        noi_dung: '',
        thu_tu: 1,
        id_khoa_hoc: null,
        video_url: '',
        video_file: null,
    });

    useEffect(() => {
        const fetchLesson = async () => {
            if (!targetId) {
                toast.error('Không tìm thấy mã bài học');
                navigate(-1);
                return;
            }

            try {
                // Ép kiểu 'as any' ở cuối hàm gọi API
                const response = await axiosClient.get<LessonApiResponse | LessonApiData>(`/lessons/${targetId}`) as any;

                // Toàn bộ dòng này sẽ hết báo đỏ ngay lập tức
                const lesson = (response.data?.data || response.data) as LessonApiData;

                setFormData({
                    tieu_de: lesson.tieu_de || '',
                    noi_dung: lesson.noi_dung || '',
                    thu_tu: lesson.thu_tu || 1,
                    id_khoa_hoc: lesson.id_khoa_hoc || null,
                    video_url: lesson.video_url || '',
                    video_file: null,
                });

                if (lesson.video_url) {
                    const fullVideoUrl = lesson.video_url.startsWith('/')
                        ? `http://localhost:3000${lesson.video_url}`
                        : lesson.video_url;
                    setVideoPreview(fullVideoUrl);
                }
            } catch {
                toast.error('Không thể tải thông tin bài học');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        void fetchLesson();
    }, [navigate, targetId]);

    const handleChange = (field: keyof LessonForm, value: LessonForm[keyof LessonForm]) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setFormData((current) => ({ ...current, video_file: file }));
        setVideoPreview(URL.createObjectURL(file));
    };

    const handleUpdate = async () => {
        if (!formData.tieu_de.trim()) {
            toast.error('Tiêu đề không được để trống');
            return;
        }

        setIsSaving(true);
        const data = new FormData();
        data.append('tieu_de', formData.tieu_de);
        data.append('noi_dung', formData.noi_dung);
        data.append('thu_tu', formData.thu_tu.toString());
        if (formData.id_khoa_hoc) {
            data.append('id_khoa_hoc', formData.id_khoa_hoc.toString());
        }
        if (formData.video_file) {
            data.append('video', formData.video_file);
        }

        try {
            await axiosClient.put(`/lessons/${targetId}`, data);
            toast.success('Cập nhật bài học thành công!');
            navigate(`/instructor/courses/${formData.id_khoa_hoc}`);
        } catch {
            toast.error('Lỗi khi cập nhật bài học');
        } finally {
            setIsSaving(false);
        }
    };

    return {
        formData,
        isSaving,
        loading,
        navigate,
        videoPreview,
        handleChange,
        handleFileChange,
        handleUpdate,
    };
}
