import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, FileText, Video, Upload, Loader2, Layout, PlayCircle } from 'lucide-react';
import InstructorLayout from '../../../layouts/InstructorLayout';
import axiosClient from '../../../api/axios';
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
  const { lessonId, id } = useParams<{ lessonId?: string; id?: string }>();
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
    video_file: null,
  });

  useEffect(() => {
    if (targetId) {
      void fetchLesson();
    } else {
      toast.error('Không tìm thấy mã bài học');
      navigate(-1);
    }
  }, [targetId]);

  const fetchLesson = async () => {
    try {
      const response: any = await axiosClient.get(`/lessons/${targetId}`);
      const data = response?.data?.data || response?.data || response;

      if (!data) throw new Error('Dữ liệu bài học trống');

      setFormData({
        tieu_de: data.tieu_de || '',
        noi_dung: data.noi_dung || '',
        thu_tu: data.thu_tu || 1,
        id_khoa_hoc: data.id_khoa_hoc || null,
        video_url: data.video_url || '',
        video_file: null,
      });

      if (data.video_url) {
        const fullVideoUrl = data.video_url.startsWith('/')
          ? `http://localhost:3000${data.video_url}`
          : data.video_url;
        setVideoPreview(fullVideoUrl);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải thông tin bài học');
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
    if (!formData.tieu_de.trim()) return toast.error('Tiêu đề không được để trống');

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
      toast.success('Cập nhật bài học thành công!');
      navigate(`/instructor/courses/${formData.id_khoa_hoc}`);
    } catch (error) {
      toast.error('Lỗi khi cập nhật bài học');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <InstructorLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-[#1dbf73]" size={32} />
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="mx-auto max-w-[1100px] px-2 py-4 lg:px-4">

        {/* ĐÃ XÓA NÚT QUAY LẠI RỜI RẠC Ở ĐÂY VÀ ĐƯA VÀO HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Sửa bài học</h1>
            <p className="mt-1 text-sm text-slate-500">Cập nhật nội dung bài giảng hiện tại.</p>
          </div>

          {/* CỤM NÚT ĐỒNG BỘ VỚI TRANG QUẢN LÝ VÀ THÊM BÀI HỌC */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <button
              onClick={handleUpdate}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-[#1dbf73] px-6 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#169b5c] hover:shadow disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-6">
            <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800">
                <FileText size={18} className="text-[#1dbf73]" /> Nội dung bài học
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tiêu đề bài học
                  </label>
                  <input
                    type="text"
                    value={formData.tieu_de}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1dbf73] focus:bg-white focus:ring-1 focus:ring-[#ebf8f2]"
                    onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Mô tả / Bài viết
                  </label>
                  <textarea
                    rows={10}
                    value={formData.noi_dung}
                    className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1dbf73] focus:bg-white focus:ring-1 focus:ring-[#ebf8f2]"
                    placeholder="Nhập nội dung giảng dạy chi tiết..."
                    onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Video size={18} className="text-[#1dbf73]" /> Video bài giảng
                </h3>
              </div>

              <input id="video-upload" type="file" accept="video/*" hidden onChange={handleFileChange} />

              {videoPreview ? (
                <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex w-full justify-center overflow-hidden rounded-md bg-black shadow-sm">
                    <video src={videoPreview} className="max-h-[350px] w-full" controls controlsList="nodownload" />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs italic text-slate-500">
                      {formData.video_file
                        ? `Đã chọn file: ${formData.video_file.name}`
                        : 'Đang hiển thị video hiện tại'}
                    </p>
                    <button
                      onClick={() => document.getElementById('video-upload')?.click()}
                      className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#1dbf73]"
                    >
                      <Upload size={16} /> Thay đổi video
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById('video-upload')?.click()}
                  className="group cursor-pointer rounded-md border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center transition hover:border-[#1dbf73] hover:bg-[#ebf8f2]/60"
                >
                  <Upload className="mx-auto mb-4 text-[#1dbf73]" size={28} />
                  <p className="font-semibold text-slate-800">Chưa có video cho bài học này</p>
                  <p className="mt-2 text-xs text-slate-400">Nhấn để tải lên video mới</p>
                </div>
              )}
            </section>
          </div>

          <div className="col-span-4 space-y-6">
            <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 flex items-center gap-2 font-bold text-slate-800">
                <Layout size={18} className="text-[#1dbf73]" /> Cấu hình
              </h3>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Thứ tự bài học
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1dbf73] focus:bg-white"
                  value={formData.thu_tu}
                  onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
                />
              </div>
            </section>

            <div className="rounded-md border border-[#1dbf73]/20 bg-[#ebf8f2]/70 p-6">
              <h4 className="mb-2 flex items-center gap-2 font-bold text-[#169b5c]">
                <PlayCircle size={16} /> Hướng dẫn
              </h4>
              <p className="text-xs leading-relaxed text-[#169b5c]">
                Bạn có thể tải video mới lên bất kỳ lúc nào để ghi đè lên tài nguyên cũ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}