import React, { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ChevronLeft, FileText, Video, Upload, Loader2, Layout, PlayCircle } from 'lucide-react';
import InstructorLayout from '../../layouts/InstructorLayout';
import axiosClient from '../../api/axios';
import { toast } from 'react-hot-toast';

interface LessonForm {
    tieu_de: string;
    noi_dung: string;
    thu_tu: number | string;
    id_khoa_hoc: string | number | null;
    video_url: string;
    video_file: File | null;
}

export default function LessonDetail() {
    // 1. SỬA LỖI PARAMS: Lấy cả lessonId và id để chống lỗi cấu hình Router
    const { lessonId, id } = useParams<{ lessonId?: string, id?: string }>();
    const targetId = lessonId || id;

    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState<LessonForm>({
        tieu_de: '',
        noi_dung: '',
        thu_tu: 1,
        id_khoa_hoc: null,
        video_url: '',
        video_file: null
    });

    useEffect(() => {
        if (targetId) {
            fetchLesson();
        } else {
            toast.error("Không tìm thấy mã bài học");
            navigate(-1);
        }
    }, [targetId]);

    const fetchLesson = async () => {
        try {
            const response: any = await axiosClient.get(`/lessons/${targetId}`);

            // 2. SỬA LỖI AXIOS: Bóc tách dữ liệu an toàn dựa theo cấu hình interceptor
            const data = response?.data?.data || response?.data || response;

            if (!data) throw new Error("Dữ liệu bài học trống");

            setFormData({
                tieu_de: data.tieu_de || '',
                noi_dung: data.noi_dung || '',
                thu_tu: data.thu_tu || 1,
                id_khoa_hoc: data.id_khoa_hoc || null,
                video_url: data.video_url || '',
                video_file: null
            });

            // 3. SỬA LỖI VIDEO CỦA NESTJS: Ghép URL tuyệt đối nếu backend trả về đường dẫn tương đối
            if (data.video_url) {
                const fullVideoUrl = data.video_url.startsWith('/')
                    ? `http://localhost:3000${data.video_url}`
                    : data.video_url;
                setVideoPreview(fullVideoUrl);
            }
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải thông tin bài học");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, video_file: file });
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async () => {
        if (!formData.tieu_de.trim()) return toast.error("Tiêu đề không được để trống");

        setIsSaving(true);
        const data = new FormData();
        data.append('tieu_de', formData.tieu_de);
        data.append('noi_dung', formData.noi_dung);
        data.append('thu_tu', formData.thu_tu.toString());
        if (formData.id_khoa_hoc) data.append('id_khoa_hoc', formData.id_khoa_hoc.toString());

        if (formData.video_file) {
            data.append('video', formData.video_file);
        }

        try {
            await axiosClient.put(`/lessons/${targetId}`, data);
            toast.success("Cập nhật bài học thành công!");
            navigate(`/instructor/courses/${formData.id_khoa_hoc}`);
        } catch (error) {
            toast.error("Lỗi khi cập nhật bài học");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <InstructorLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
            </InstructorLayout>
        );
    }

    return (
        <InstructorLayout>
            <div className="max-w-[1100px] mx-auto p-6">
                {/* Header điều hướng */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Sửa bài học</h1>
                            <p className="text-sm text-gray-500 italic">Cập nhật nội dung bài giảng hiện tại</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate(-1)} className="px-5 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
                        <button
                            onClick={handleUpdate}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-semibold shadow-md hover:bg-[#0747A6] disabled:opacity-50 transition-all"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Cột trái: Form nhập liệu */}
                    <div className="col-span-8 space-y-6">
                        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-gray-800">
                                <FileText size={18} className="text-blue-600" /> Nội dung bài học
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tiêu đề bài học</label>
                                    <input
                                        type="text"
                                        value={formData.tieu_de}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Mô tả / Bài viết (Dạng Blog)</label>
                                    <textarea
                                        rows={10}
                                        value={formData.noi_dung}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                        placeholder="Nhập nội dung giảng dạy chi tiết..."
                                        onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    <Video size={18} className="text-blue-600" /> Video bài giảng
                                </h3>
                            </div>

                            <input
                                id="video-upload"
                                type="file"
                                accept="video/*"
                                hidden
                                onChange={handleFileChange}
                            />

                            {videoPreview ? (
                                <div className="space-y-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
                                    <div className="bg-black rounded-lg overflow-hidden flex justify-center w-full shadow-inner">
                                        <video
                                            src={videoPreview}
                                            className="max-h-[350px] w-full"
                                            controls
                                            controlsList="nodownload"
                                        />
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <p className="text-xs text-gray-500 italic">
                                            {formData.video_file ? `Đã chọn file: ${formData.video_file.name}` : "Đang hiển thị video hiện tại trên hệ thống"}
                                        </p>
                                        <button
                                            onClick={() => document.getElementById('video-upload')?.click()}
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-lg text-sm font-semibold transition-colors border border-gray-300 shadow-sm"
                                        >
                                            <Upload size={16} /> Thay đổi video
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => document.getElementById('video-upload')?.click()}
                                    className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
                                >
                                    <Upload className="text-blue-600 mx-auto mb-4" size={28} />
                                    <p className="font-bold text-gray-700">Chưa có video cho bài học này</p>
                                    <p className="text-xs text-gray-400 mt-2">Nhấn để tải lên video mới (Hỗ trợ MP4, WebM)</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Cột phải: Cài đặt phụ */}
                    <div className="col-span-4 space-y-6">
                        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Layout size={18} className="text-blue-600" /> Cấu hình
                            </h3>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Thứ tự bài học</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                    value={formData.thu_tu}
                                    onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
                                />
                            </div>
                        </section>

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                            <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                                <PlayCircle size={16} /> Hướng dẫn
                            </h4>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Bạn có thể giữ nguyên nội dung cũ hoặc tải lên video mới để thay thế video hiện tại trên hệ thống.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
}