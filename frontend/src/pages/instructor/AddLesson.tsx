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
    const { id } = useParams<{ id: string }>();
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
            data.append('video', formData.video_file);
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
            <div className="mx-auto max-w-[1100px] px-2 py-4 lg:px-4">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="rounded-md border border-slate-200 bg-white p-2.5 shadow-sm transition hover:bg-slate-50">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Thêm bài học mới</h1>
                            <p className="text-sm text-slate-500 italic">Thiết lập nội dung bài giảng cho học viên</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate(-1)} className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">Hủy</button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                            <Save size={16} /> {loading ? 'Đang xử lý...' : 'Lưu bài học'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8 space-y-6">
                        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800">
                                <FileText size={18} className="text-emerald-600" /> Thông tin bài học
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tiêu đề bài học <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-100"
                                        placeholder="Ví dụ: Giới thiệu về hệ thống"
                                        onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nội dung chi tiết</label>
                                    <textarea
                                        rows={8}
                                        className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-100"
                                        placeholder="Nhập nội dung giảng dạy..."
                                        onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
                                    />
                                    performance</div>
                            </div>
                        </section>

                        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800">
                                <Video size={18} className="text-emerald-600" /> Nội dung Video
                            </h3>
                            <div
                                onClick={() => document.getElementById('video-upload')?.click()}
                                className="group relative cursor-pointer rounded-md border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center transition hover:border-emerald-300 hover:bg-emerald-50/60"
                            >
                                <input id="video-upload" type="file" accept="video/*" hidden onChange={handleFileChange} />

                                {videoPreview ? (
                                    <video src={videoPreview} className="mx-auto max-h-[300px] rounded-md shadow-md" controls />
                                ) : (
                                    <>
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 transition-transform group-hover:scale-105">
                                            <Upload className="text-emerald-600" size={28} />
                                        </div>
                                        <p className="font-bold text-slate-700">Nhấn để tải video bài giảng</p>
                                        <p className="text-xs text-slate-400 mt-2 italic">Dung lượng tối đa hỗ trợ 100MB</p>
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="col-span-4 space-y-6">
                        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Layout size={18} className="text-emerald-600" /> Cài đặt hiển thị
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white"
                                        value={formData.thu_tu}
                                        onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2">Bài học có số nhỏ hơn sẽ hiển thị trước.</p>
                                </div>
                            </div>
                        </section>

                        <div className="rounded-md border border-emerald-100 bg-emerald-50/70 p-6">
                            <h4 className="text-emerald-900 font-bold mb-2">Mẹo nhỏ</h4>
                            <p className="text-xs text-emerald-700 leading-relaxed">
                                Chuẩn bị video dạng MP4 để có tốc độ xử lý tối ưu nhất trên máy chủ lưu trữ.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
}