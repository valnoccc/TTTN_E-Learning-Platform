import {
    ArrowLeft,
    CheckCircle2,
    FileText,
    Layout,
    Link2,
    Loader2,
    Save,
    Upload,
    Video,
} from 'lucide-react';

import InstructorLayout from '../../../layouts/InstructorLayout';
import { useLessonCreateForm, isValidYoutubeUrl } from './hooks/useLessonForm';

// ─── Sub-component: Video Source Toggle ─────────────────────────────────────
function VideoSourceToggle({
    value,
    onChange,
    disabled,
}: {
    value: 'UPLOAD' | 'YOUTUBE';
    onChange: (v: 'UPLOAD' | 'YOUTUBE') => void;
    disabled?: boolean;
}) {
    return (
        <div className="mb-5 flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange('UPLOAD')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-all ${
                    value === 'UPLOAD'
                        ? 'bg-white text-[#1dbf73] shadow-sm ring-1 ring-[#1dbf73]/30'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <Upload size={15} />
                Tải file lên
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange('YOUTUBE')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-all ${
                    value === 'YOUTUBE'
                        ? 'bg-white text-rose-500 shadow-sm ring-1 ring-rose-400/30'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <Link2 size={15} />
                Dùng link YouTube
            </button>
        </div>
    );
}

// ─── Sub-component: Upload Progress Bar ─────────────────────────────────────
function VideoUploadProgress({
    progress,
    phase,
}: {
    progress: number;
    phase: 'idle' | 'uploading' | 'processing';
}) {
    if (phase === 'idle') return null;

    if (phase === 'processing') {
        return (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">
                        Đang xử lý &amp; AI đang kiểm duyệt...
                    </span>
                </div>
                {/* Skeleton shimmer */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100">
                    <div className="h-full animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-[length:200%_100%]" />
                </div>
                <p className="text-[11px] text-amber-600">
                    Video đã tải lên thành công. Hệ thống đang phân tích nội dung, vui lòng chờ...
                </p>
            </div>
        );
    }

    // phase === 'uploading'
    return (
        <div className="space-y-2 rounded-lg border border-[#1dbf73]/30 bg-[#ebf8f2]/70 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Upload size={15} className="text-[#1dbf73]" />
                    <span className="text-sm font-semibold text-[#169b5c]">
                        Đang tải lên... {progress}%
                    </span>
                </div>
                {progress === 100 && (
                    <CheckCircle2 size={16} className="text-[#1dbf73]" />
                )}
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1dbf73]/20">
                <div
                    className="h-full rounded-full bg-[#1dbf73] transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-[11px] text-[#169b5c]">
                {progress < 100
                    ? 'Vui lòng không đóng trang trong khi tải lên...'
                    : 'Đã tải lên xong! Đang chuẩn bị xử lý...'}
            </p>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LessonCreate() {
    const {
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
    } = useLessonCreateForm();

    const remainingTitleChars = 60 - Math.min(formData.tieu_de.length, 60);
    const isSubmitting = loading;

    return (
        <InstructorLayout>
            <div className="mx-auto max-w-[1100px] px-2 py-4 lg:px-4">
                {/* ── Header ── */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Thêm bài học mới</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Thiết lập nội dung bài giảng cho học viên
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                        >
                            <ArrowLeft size={16} />
                            Quay lại
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-md bg-[#1dbf73] px-6 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#169b5c] hover:shadow disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {isSubmitting ? 'Đang xử lý...' : 'Lưu bài học'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* ── Left Column ── */}
                    <div className="col-span-12 space-y-6 lg:col-span-8">
                        {/* Thông tin bài học */}
                        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800">
                                <FileText size={18} className="text-[#1dbf73]" /> Thông tin bài học
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Tiêu đề bài học <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1dbf73] focus:bg-white focus:ring-1 focus:ring-[#ebf8f2]"
                                        placeholder="Ví dụ: Giới thiệu về hệ thống"
                                        value={formData.tieu_de}
                                        maxLength={60}
                                        onChange={(e) => handleChange('tieu_de', e.target.value)}
                                    />
                                    <p className="mt-2 text-xs text-slate-400">
                                        Còn lại {remainingTitleChars} ký tự.
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Nội dung chi tiết
                                    </label>
                                    <textarea
                                        rows={8}
                                        className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1dbf73] focus:bg-white focus:ring-1 focus:ring-[#ebf8f2]"
                                        placeholder="Nhập nội dung giảng dạy..."
                                        value={formData.noi_dung}
                                        onChange={(e) => handleChange('noi_dung', e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Video */}
                        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                                <Video size={18} className="text-[#1dbf73]" /> Nội dung video
                            </h3>

                            {isQuotaExceeded ? (
                                <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-center">
                                    <p className="font-bold text-rose-700">🚫 Đã vượt hạn mức 1.000 phút AI</p>
                                    <p className="mt-2 text-sm text-rose-600">
                                        Tính năng tải lên video tạm thời bị khóa. Vui lòng chờ đến tháng sau.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Source type toggle */}
                                    <VideoSourceToggle
                                        value={videoSourceType}
                                        onChange={setVideoSourceType}
                                        disabled={isSubmitting}
                                    />

                                    {/* ── UPLOAD mode ── */}
                                    {videoSourceType === 'UPLOAD' && (
                                        <>
                                            <input
                                                id="video-upload-create"
                                                type="file"
                                                accept=".mp4,.webm,video/mp4,video/webm"
                                                hidden
                                                onChange={handleFileChange}
                                                disabled={isSubmitting}
                                            />

                                            {videoPreview ? (
                                                <div className="space-y-4">
                                                    <div className="overflow-hidden rounded-md bg-black shadow-sm">
                                                        <video
                                                            src={videoPreview}
                                                            className="max-h-[320px] w-full"
                                                            controls
                                                            controlsList="nodownload"
                                                        />
                                                    </div>
                                                    {!isSubmitting && (
                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={() =>
                                                                    document
                                                                        .getElementById('video-upload-create')
                                                                        ?.click()
                                                                }
                                                                className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#1dbf73]"
                                                            >
                                                                <Upload size={15} /> Chọn video khác
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() =>
                                                        !isSubmitting &&
                                                        document
                                                            .getElementById('video-upload-create')
                                                            ?.click()
                                                    }
                                                    className={`group cursor-pointer rounded-md border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center transition ${
                                                        isSubmitting
                                                            ? 'cursor-not-allowed opacity-60'
                                                            : 'hover:border-[#1dbf73] hover:bg-[#ebf8f2]/60'
                                                    }`}
                                                >
                                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ebf8f2] transition-transform group-hover:scale-105">
                                                        <Upload className="text-[#1dbf73]" size={28} />
                                                    </div>
                                                    <p className="font-bold text-slate-700">
                                                        Nhấn để chọn video bài giảng
                                                    </p>
                                                    <p className="mt-2 text-xs italic text-slate-400">
                                                        Chỉ chấp nhận MP4, WebM · Tối đa 5GB
                                                    </p>
                                                </div>
                                            )}

                                            {/* Progress Bar */}
                                            {uploadPhase !== 'idle' && (
                                                <div className="mt-4">
                                                    <VideoUploadProgress
                                                        progress={uploadProgress}
                                                        phase={uploadPhase}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* ── YOUTUBE mode ── */}
                                    {videoSourceType === 'YOUTUBE' && (
                                        <div className="space-y-3">
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Link YouTube
                                            </label>
                                            <div className="relative">
                                                <Link2
                                                    size={16}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                />
                                                <input
                                                    type="url"
                                                    value={youtubeUrl}
                                                    onChange={(e) =>
                                                        handleYoutubeUrlChange(e.target.value)
                                                    }
                                                    placeholder="https://youtube.com/watch?v=..."
                                                    disabled={isSubmitting}
                                                    className={`w-full rounded-md border py-3 pl-9 pr-4 outline-none transition focus:ring-1 ${
                                                        youtubeUrlError
                                                            ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-200'
                                                            : youtubeUrl && isValidYoutubeUrl(youtubeUrl)
                                                              ? 'border-[#1dbf73] bg-[#ebf8f2]/30 focus:ring-[#ebf8f2]'
                                                              : 'border-slate-200 bg-slate-50 focus:border-[#1dbf73] focus:ring-[#ebf8f2]'
                                                    }`}
                                                />
                                            </div>
                                            {youtubeUrlError && (
                                                <p className="flex items-center gap-1.5 text-xs text-rose-500">
                                                    <span>⚠️</span> {youtubeUrlError}
                                                </p>
                                            )}
                                            {youtubeUrl && isValidYoutubeUrl(youtubeUrl) && (
                                                <p className="flex items-center gap-1.5 text-xs text-[#1dbf73]">
                                                    <CheckCircle2 size={13} /> Link hợp lệ
                                                </p>
                                            )}
                                            <p className="text-[11px] leading-relaxed text-slate-400">
                                                Lưu ý: Video YouTube sẽ không qua AI kiểm duyệt và không được lưu trữ trên hệ thống.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>

                    {/* ── Right Column ── */}
                    <div className="col-span-12 space-y-6 lg:col-span-4">
                        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-6 flex items-center gap-2 font-bold text-slate-800">
                                <Layout size={18} className="text-[#1dbf73]" /> Cài đặt hiển thị
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Thứ tự hiển thị
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1dbf73] focus:bg-white"
                                        value={formData.thu_tu}
                                        onChange={(e) => handleChange('thu_tu', e.target.value)}
                                    />
                                    <p className="mt-2 text-[10px] text-slate-400">
                                        Bài học có số nhỏ hơn sẽ hiển thị trước.
                                    </p>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-slate-700">Cho phép xem trước</p>
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                Bật để học viên có thể xem trước bài học này.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={formData.choPhepXemTruoc}
                                            onClick={() =>
                                                handleChange('choPhepXemTruoc', !formData.choPhepXemTruoc)
                                            }
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                                                formData.choPhepXemTruoc
                                                    ? 'border-[#1dbf73] bg-[#1dbf73]'
                                                    : 'border-slate-300 bg-slate-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                                    formData.choPhepXemTruoc
                                                        ? 'translate-x-6'
                                                        : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="rounded-md border border-[#1dbf73]/20 bg-[#ebf8f2]/70 p-6">
                            <h4 className="mb-2 font-bold text-[#169b5c]">💡 Mẹo nhỏ</h4>
                            <ul className="space-y-1.5 text-xs leading-relaxed text-[#169b5c]">
                                <li>• Chuẩn bị video MP4 để xử lý tối ưu nhất.</li>
                                <li>• Độ phân giải tối đa: <strong>1080p</strong>.</li>
                                <li>• Thời lượng tối đa: <strong>3 giờ</strong>.</li>
                                <li>• Dung lượng tối đa: <strong>5GB</strong>.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
}
