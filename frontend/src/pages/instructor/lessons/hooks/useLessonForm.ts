import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';
import { toAbsoluteApiUrl } from '../../../../config/api';

const LESSON_TITLE_MAX_LENGTH = 60;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

// ─── YouTube URL validation ──────────────────────────────────────────────────
const YOUTUBE_URL_REGEX =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w\-]{11}(\S*)?$/i;

export function isValidYoutubeUrl(url: string): boolean {
    return YOUTUBE_URL_REGEX.test(url.trim());
}

// ─── Types ───────────────────────────────────────────────────────────────────
export type VideoSourceType = 'UPLOAD' | 'YOUTUBE';
export type UploadPhase = 'idle' | 'uploading' | 'processing';

export interface LessonForm {
    tieu_de: string;
    noi_dung: string;
    thu_tu: number | string;
    id_khoa_hoc?: string | number | null;
    video_url?: string;
    video_file: File | null;
    choPhepXemTruoc: boolean;
    id?: number | string;
    maBH?: number | string;
    aiStatus?: string | null;
    aiLabels?: string[] | null;
    aiRejectReason?: string | null;
    videoSourceType?: VideoSourceType;
    youtubeUrl?: string;
    resolution?: number | null;
}

interface LessonApiData {
    tieu_de?: string;
    noi_dung?: string;
    thu_tu?: number;
    id_khoa_hoc?: string | number | null;
    video_url?: string;
    choPhepXemTruoc?: boolean;
    cho_phep_xem_truoc?: boolean;
    id?: number | string;
    maBH?: number | string;
    aiStatus?: string | null;
    aiLabels?: string[] | null;
    aiRejectReason?: string | null;
    videoSourceType?: VideoSourceType;
    resolution?: number | null;
}

interface LessonApiResponse {
    data?: LessonApiData;
    message?: string;
}

// ─── useLessonCreateForm ─────────────────────────────────────────────────────
export function useLessonCreateForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const abortControllerRef = useRef<AbortController | null>(null);

    const [loading, setLoading] = useState(false);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [videoSourceType, setVideoSourceType] = useState<VideoSourceType>('UPLOAD');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeUrlError, setYoutubeUrlError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

    const [formData, setFormData] = useState<LessonForm>({
        tieu_de: '',
        noi_dung: '',
        thu_tu: 1,
        video_file: null,
        choPhepXemTruoc: false,
        videoSourceType: 'UPLOAD',
    });

    useEffect(() => {
        const fetchQuota = async () => {
            try {
                const res: any = await axiosClient.get('/ai/quota');
                const quota = res?.data ?? res;
                if (quota?.isExceeded) {
                    setIsQuotaExceeded(true);
                }
            } catch {
                // Ignore error
            }
        };
        void fetchQuota();
    }, []);

    // Cleanup object URL khi unmount
    useEffect(() => {
        return () => {
            if (videoPreview && videoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(videoPreview);
            }
        };
    }, [videoPreview]);

    const handleChange = (field: keyof LessonForm, value: LessonForm[keyof LessonForm]) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate MIME type
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
            toast.error(`Định dạng không hợp lệ: "${file.type}". Chỉ chấp nhận MP4 và WebM.`);
            event.target.value = '';
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error('File quá lớn. Kích thước tối đa cho phép là 5GB.');
            event.target.value = '';
            return;
        }

        setFormData((current) => ({ ...current, video_file: file }));
        if (videoPreview && videoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(videoPreview);
        }
        setVideoPreview(URL.createObjectURL(file));
        setUploadPhase('idle');
        setUploadProgress(0);
    };

    const handleYoutubeUrlChange = (url: string) => {
        setYoutubeUrl(url);
        if (url && !isValidYoutubeUrl(url)) {
            setYoutubeUrlError('Link YouTube không hợp lệ. VD: https://youtube.com/watch?v=xxxxx');
        } else {
            setYoutubeUrlError(null);
        }
    };

    const handleSave = async () => {
        if (!formData.tieu_de.trim()) {
            toast.error('Vui lòng nhập tiêu đề bài học');
            return;
        }
        if (formData.tieu_de.trim().length > LESSON_TITLE_MAX_LENGTH) {
            toast.error(`Tiêu đề bài học không được vượt quá ${LESSON_TITLE_MAX_LENGTH} ký tự`);
            return;
        }

        // Validate theo nguồn video
        if (videoSourceType === 'YOUTUBE') {
            if (!youtubeUrl.trim()) {
                toast.error('Vui lòng nhập link YouTube');
                return;
            }
            if (!isValidYoutubeUrl(youtubeUrl)) {
                toast.error('Link YouTube không hợp lệ');
                return;
            }
        }

        setLoading(true);
        setUploadProgress(0);
        if (videoSourceType === 'UPLOAD' && formData.video_file) {
            setUploadPhase('uploading');
        }

        const data = new FormData();
        if (id) data.append('id_khoa_hoc', id);
        data.append('tieu_de', formData.tieu_de);
        data.append('noi_dung', formData.noi_dung);
        data.append('thu_tu', formData.thu_tu.toString());
        data.append('choPhepXemTruoc', String(formData.choPhepXemTruoc));
        data.append('videoSourceType', videoSourceType);

        if (videoSourceType === 'UPLOAD' && formData.video_file) {
            data.append('video', formData.video_file);
        } else if (videoSourceType === 'YOUTUBE') {
            data.append('youtubeUrl', youtubeUrl.trim());
        }

        abortControllerRef.current = new AbortController();

        try {
            await axiosClient.post('/lessons', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: abortControllerRef.current.signal,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && progressEvent.total > 0) {
                        const percent = Math.round(
                            (progressEvent.loaded / progressEvent.total) * 100,
                        );
                        setUploadProgress(percent);
                        if (percent >= 100) {
                            setUploadPhase('processing');
                        }
                    }
                },
            });
            toast.success('Thêm bài học thành công!');
            navigate(`/instructor/courses/${id}/lessons`);
        } catch (error: unknown) {
            if ((error as any)?.code === 'ERR_CANCELED') return;
            const message =
                typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof (error as { response?: { data?: { message?: string } } }).response?.data
                        ?.message === 'string'
                    ? (error as { response: { data: { message: string } } }).response.data.message
                    : 'Lỗi khi tải bài học lên hệ thống';
            toast.error(message);
            setUploadPhase('idle');
            setUploadProgress(0);
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        navigate,
        videoPreview,
        videoSourceType,
        setVideoSourceType,
        youtubeUrl,
        youtubeUrlError,
        uploadProgress,
        uploadPhase,
        isQuotaExceeded,
        handleChange,
        handleFileChange,
        handleYoutubeUrlChange,
        handleSave,
    };
}

// ─── useLessonDetailForm ─────────────────────────────────────────────────────
export function useLessonDetailForm() {
    const { lessonId, id } = useParams<{ lessonId?: string; id?: string }>();
    const targetId = lessonId || id;
    const navigate = useNavigate();
    const abortControllerRef = useRef<AbortController | null>(null);

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [videoSourceType, setVideoSourceType] = useState<VideoSourceType>('UPLOAD');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeUrlError, setYoutubeUrlError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
    const [formData, setFormData] = useState<LessonForm>({
        tieu_de: '',
        noi_dung: '',
        thu_tu: 1,
        id_khoa_hoc: null,
        video_url: '',
        video_file: null,
        choPhepXemTruoc: false,
    });

    useEffect(() => {
        const fetchLesson = async () => {
            if (!targetId) {
                toast.error('Không tìm thấy mã bài học');
                navigate(-1);
                return;
            }

            try {
                const response = await axiosClient.get<LessonApiResponse | LessonApiData>(
                    `/lessons/${targetId}`,
                ) as any;

                const lesson = (response.data?.data || response.data) as LessonApiData;

                const srcType: VideoSourceType =
                    lesson.videoSourceType === 'YOUTUBE' ? 'YOUTUBE' : 'UPLOAD';

                setVideoSourceType(srcType);

                // Nếu là YouTube, lấy URL vào state youtubeUrl
                if (srcType === 'YOUTUBE' && lesson.video_url) {
                    setYoutubeUrl(lesson.video_url);
                }

                setFormData({
                    tieu_de: lesson.tieu_de || '',
                    noi_dung: lesson.noi_dung || '',
                    thu_tu: lesson.thu_tu || 1,
                    id_khoa_hoc: lesson.id_khoa_hoc || null,
                    video_url: lesson.video_url || '',
                    video_file: null,
                    choPhepXemTruoc: lesson.choPhepXemTruoc ?? lesson.cho_phep_xem_truoc ?? false,
                    id: lesson.id ?? lesson.maBH,
                    maBH: lesson.maBH ?? lesson.id,
                    aiStatus: lesson.aiStatus ?? null,
                    aiLabels: lesson.aiLabels ?? null,
                    aiRejectReason: lesson.aiRejectReason ?? null,
                    videoSourceType: srcType,
                    resolution: lesson.resolution ?? null,
                });

                if (srcType === 'UPLOAD' && lesson.video_url) {
                    setVideoPreview(toAbsoluteApiUrl(lesson.video_url));
                }
            } catch {
                toast.error('Không thể tải thông tin bài học');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        const fetchQuota = async () => {
            try {
                const res: any = await axiosClient.get('/ai/quota');
                const quota = res?.data ?? res;
                if (quota?.isExceeded) {
                    setIsQuotaExceeded(true);
                }
            } catch {
                // Ignore error
            }
        };

        void fetchLesson();
        void fetchQuota();
    }, [navigate, targetId]);

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            if (videoPreview && videoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(videoPreview);
            }
        };
    }, [videoPreview]);

    const handleChange = (field: keyof LessonForm, value: LessonForm[keyof LessonForm]) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate MIME type
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
            toast.error(`Định dạng không hợp lệ: "${file.type}". Chỉ chấp nhận MP4 và WebM.`);
            event.target.value = '';
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error('File quá lớn. Kích thước tối đa cho phép là 5GB.');
            event.target.value = '';
            return;
        }

        setFormData((current) => ({ ...current, video_file: file }));
        if (videoPreview && videoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(videoPreview);
        }
        setVideoPreview(URL.createObjectURL(file));
        setUploadPhase('idle');
        setUploadProgress(0);
    };

    const handleYoutubeUrlChange = (url: string) => {
        setYoutubeUrl(url);
        if (url && !isValidYoutubeUrl(url)) {
            setYoutubeUrlError('Link YouTube không hợp lệ. VD: https://youtube.com/watch?v=xxxxx');
        } else {
            setYoutubeUrlError(null);
        }
    };

    const handleUpdate = async () => {
        if (!formData.tieu_de.trim()) {
            toast.error('Tiêu đề không được để trống');
            return;
        }
        if (formData.tieu_de.trim().length > LESSON_TITLE_MAX_LENGTH) {
            toast.error(`Tiêu đề bài học không được vượt quá ${LESSON_TITLE_MAX_LENGTH} ký tự`);
            return;
        }

        if (videoSourceType === 'YOUTUBE') {
            if (!youtubeUrl.trim()) {
                toast.error('Vui lòng nhập link YouTube');
                return;
            }
            if (!isValidYoutubeUrl(youtubeUrl)) {
                toast.error('Link YouTube không hợp lệ');
                return;
            }
        }

        setIsSaving(true);
        setUploadProgress(0);
        if (videoSourceType === 'UPLOAD' && formData.video_file) {
            setUploadPhase('uploading');
        }

        const data = new FormData();
        data.append('tieu_de', formData.tieu_de);
        data.append('noi_dung', formData.noi_dung);
        data.append('thu_tu', formData.thu_tu.toString());
        data.append('choPhepXemTruoc', String(formData.choPhepXemTruoc));
        data.append('videoSourceType', videoSourceType);

        if (formData.id_khoa_hoc) {
            data.append('id_khoa_hoc', formData.id_khoa_hoc.toString());
        }

        if (videoSourceType === 'UPLOAD' && formData.video_file) {
            data.append('video', formData.video_file);
        } else if (videoSourceType === 'YOUTUBE') {
            data.append('youtubeUrl', youtubeUrl.trim());
        }

        abortControllerRef.current = new AbortController();

        try {
            await axiosClient.put(`/lessons/${targetId}`, data, {
                signal: abortControllerRef.current.signal,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && progressEvent.total > 0) {
                        const percent = Math.round(
                            (progressEvent.loaded / progressEvent.total) * 100,
                        );
                        setUploadProgress(percent);
                        if (percent >= 100) {
                            setUploadPhase('processing');
                        }
                    }
                },
            });
            toast.success('Cập nhật bài học thành công!');
            navigate(`/instructor/courses/${formData.id_khoa_hoc}/lessons`);
        } catch (error: unknown) {
            if ((error as any)?.code === 'ERR_CANCELED') return;
            const message =
                typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof (error as { response?: { data?: { message?: string } } }).response?.data
                        ?.message === 'string'
                    ? (error as { response: { data: { message: string } } }).response.data.message
                    : 'Lỗi khi cập nhật bài học';
            toast.error(message);
            setUploadPhase('idle');
            setUploadProgress(0);
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
        videoSourceType,
        setVideoSourceType,
        youtubeUrl,
        youtubeUrlError,
        uploadProgress,
        uploadPhase,
        isQuotaExceeded,
        handleChange,
        handleFileChange,
        handleYoutubeUrlChange,
        handleUpdate,
    };
}
