import { useState, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Video, FileText, Save, ArrowLeft, Layout } from 'lucide-react';
import InstructorLayout from '../../../layouts/InstructorLayout';
import axiosClient from '../../../api/axios';
import { toast } from 'react-hot-toast';

interface LessonForm {
  tieu_de: string;
  noi_dung: string;
  thu_tu: number | string;
  video_file: File | null;
}

export default function LessonCreate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<LessonForm>({
    tieu_de: '',
    noi_dung: '',
    thu_tu: 1,
    video_file: null,
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, video_file: file });
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!formData.tieu_de) return toast.error('Vui lòng nhập tiêu đề bài học');

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
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Thêm bài học thành công!');
      navigate(`/instructor/courses/${id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi tải bài học lên hệ thống';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="mx-auto max-w-[1100px] px-2 py-4 lg:px-4">

        {/* Nút quay lại đồng nhất */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại khóa học
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Thêm bài học mới</h1>
            <p className="text-sm text-slate-500 italic">Thiết lập nội dung bài giảng cho học viên</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-sm border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 rounded-sm bg-[#1dbf73] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#169b5c] disabled:opacity-50"
            >
              <Save size={16} /> {loading ? 'Đang xử lý...' : 'Lưu bài học'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-6">
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
                    onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nội dung chi tiết
                  </label>
                  <textarea
                    rows={8}
                    className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1dbf73] focus:bg-white focus:ring-1 focus:ring-[#ebf8f2]"
                    placeholder="Nhập nội dung giảng dạy..."
                    onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Video size={18} className="text-[#1dbf73]" /> Nội dung Video
              </h3>
              <div
                onClick={() => document.getElementById('video-upload')?.click()}
                className="group relative cursor-pointer rounded-md border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center transition hover:border-[#1dbf73] hover:bg-[#ebf8f2]/60"
              >
                <input id="video-upload" type="file" accept="video/*" hidden onChange={handleFileChange} />

                {videoPreview ? (
                  <video src={videoPreview} className="mx-auto max-h-[300px] rounded-md shadow-md" controls />
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ebf8f2] transition-transform group-hover:scale-105">
                      <Upload className="text-[#1dbf73]" size={28} />
                    </div>
                    <p className="font-bold text-slate-700">Nhấn để tải video bài giảng</p>
                    <p className="mt-2 text-xs italic text-slate-400">Dung lượng tối đa hỗ trợ 100MB</p>
                  </>
                )}
              </div>
            </section>
          </div>

          <div className="col-span-4 space-y-6">
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
                    onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
                  />
                  <p className="mt-2 text-[10px] text-slate-400">Bài học có số nhỏ hơn sẽ hiển thị trước.</p>
                </div>
              </div>
            </section>

            <div className="rounded-md border border-[#1dbf73]/20 bg-[#ebf8f2]/70 p-6">
              <h4 className="mb-2 font-bold text-[#169b5c]">Mẹo nhỏ</h4>
              <p className="text-xs leading-relaxed text-[#169b5c]">
                Chuẩn bị video dạng MP4 để có tốc độ xử lý tối ưu nhất trên máy chủ lưu trữ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}