import React, { useState, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Video, FileText, Save, ChevronLeft, Layout } from 'lucide-react';
import InstructorLayout from '../../layouts/InstructorLayout';
import axiosClient from '../../api/axios';
import { toast } from 'react-hot-toast';

interface LessonForm {
    tieu_de: string;
    noi_dung: string;
    thu_tu: number | string;
    video_file: File | null;
}

export default function AddLesson() {
    const { id } = useParams<{ id: string }>(); // Lấy id_khoa_hoc từ URL
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState<LessonForm>({
        tieu_de: '',
        noi_dung: '',
        thu_tu: 1,
        video_file: null
    });

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, video_file: file });
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!formData.tieu_de) return toast.error("Vui lòng nhập tiêu đề bài học");

        setLoading(true);
        const data = new FormData();
        if (id) data.append('id_khoa_hoc', id);
        data.append('tieu_de', formData.tieu_de);
        data.append('noi_dung', formData.noi_dung);
        data.append('thu_tu', formData.thu_tu.toString());
        if (formData.video_file) {
            data.append('video', formData.video_file); // 'video' khớp với FileInterceptor ở Backend
        }

        try {
            await axiosClient.post('/lessons', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Thêm bài học thành công!");
            navigate(`/instructor/courses/${id}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Lỗi khi tải bài học lên hệ thống";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

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
                            <h1 className="text-2xl font-bold text-gray-900">Thêm bài học mới</h1>
                            <p className="text-sm text-gray-500 italic">Thiết lập nội dung bài giảng cho học viên</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate(-1)} className="px-5 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-semibold shadow-md hover:bg-[#0747A6] disabled:opacity-50 transition-all"
                        >
                            <Save size={16} /> {loading ? 'Đang xử lý...' : 'Lưu bài học'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Cột trái: Nhập liệu chính */}
                    <div className="col-span-8 space-y-6">
                        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-gray-800">
                                <FileText size={18} className="text-blue-600" /> Thông tin bài học
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tiêu đề bài học <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Ví dụ: Giới thiệu về hệ thống"
                                        onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nội dung chi tiết</label>
                                    <textarea
                                        rows={8}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                        placeholder="Nhập nội dung giảng dạy..."
                                        onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-gray-800">
                                <Video size={18} className="text-blue-600" /> Nội dung Video
                            </h3>
                            <div
                                onClick={() => document.getElementById('video-upload')?.click()}
                                className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
                            >
                                <input id="video-upload" type="file" accept="video/*" hidden onChange={handleFileChange} />

                                {videoPreview ? (
                                    <video src={videoPreview} className="max-h-[300px] mx-auto rounded-lg shadow-lg" controls />
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <Upload className="text-blue-600" size={28} />
                                        </div>
                                        <p className="font-bold text-gray-700">Nhấn để tải video bài giảng</p>
                                        <p className="text-xs text-gray-400 mt-2 italic">Dung lượng tối đa hỗ trợ 100MB (Gói Cloudinary Free)</p>
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Cột phải: Cấu hình phụ */}
                    <div className="col-span-4 space-y-6">
                        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Layout size={18} className="text-blue-600" /> Cài đặt hiển thị
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                        value={formData.thu_tu}
                                        onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2">Bài học có số nhỏ hơn sẽ hiển thị trước.</p>
                                </div>
                            </div>
                        </section>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
                            <h4 className="text-blue-900 font-bold mb-2">Mẹo nhỏ</h4>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Bạn nên chuẩn bị video ở định dạng MP4 để có tốc độ tải lên và xử lý trên Cloudinary nhanh nhất.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
}