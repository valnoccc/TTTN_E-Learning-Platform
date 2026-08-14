import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, FileText, Image as ImageIcon, Eye } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import axiosClient from '../../../api/axios';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import slugify from 'slugify';

interface PostFormData {
  tieuDe: string;
  slug: string;
  tomTat: string;
  noiDung: string;
  hinhAnh: string;
  trangThai: string;
  maDMBV: number;
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'bullet',
  'link',
  'image',
  'video',
];

export default function AdminPostForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [isFetching, setIsFetching] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Khởi tạo React Hook Form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PostFormData>({
    defaultValues: {
      tieuDe: '',
      slug: '',
      tomTat: '',
      noiDung: '',
      hinhAnh: '',
      trangThai: 'DRAFT',
      maDMBV: 1,
    },
  });

  const watchHinhAnh = watch('hinhAnh');
  const watchTieuDe = watch('tieuDe');

  // Load data nếu đang ở chế độ Edit
  useEffect(() => {
    if (isEdit && id) {
      setIsFetching(true);
      axiosClient
        .get(`/admin/posts/${id}`)
        .then((res: any) => {
          const post = res?.data?.data || res?.data; // Tương thích 2 kiểu response
          if (post) {
            setValue('tieuDe', post.tieuDe || '');
            setValue('slug', post.slug || '');
            setValue('tomTat', post.tomTat || '');
            setValue('noiDung', post.noiDung || '');
            setValue('hinhAnh', post.hinhAnh || '');
            setValue('trangThai', post.trangThai || 'DRAFT');
            setValue('maDMBV', post.maDMBV || 1);
            setSlugManuallyEdited(true);
          }
        })
        .catch((err: any) => {
          console.error('Lỗi khi tải bài viết:', err);
          toast.error('Không thể tải bài viết');
          navigate('/admin/posts');
        })
        .finally(() => setIsFetching(false));
    }
  }, [isEdit, id, navigate, setValue]);

  // Load categories
  useEffect(() => {
    axiosClient.get('/admin/post-categories').then((res: any) => {
      setCategories(res?.data || []);
    }).catch(() => {
      toast.error('Không thể tải danh mục bài viết');
    });
  }, []);

  // Giả lập hàm Upload Image
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageUpload = async (file: File): Promise<string> => {
    // Giả lập delay upload API
    return new Promise((resolve) => {
      setTimeout(() => {
        // Trả về một URL ảnh ngẫu nhiên hoặc ảnh mặc định từ picsum
        const randomId = Math.floor(Math.random() * 1000);
        resolve(`https://picsum.photos/seed/${randomId}/800/400`);
      }, 1500);
    });
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file định dạng hình ảnh!');
      return;
    }

    const toastId = toast.loading('Đang tải ảnh lên...');
    try {
      // Tích hợp API upload Cloudinary ở đây sau
      const url = await handleImageUpload(file);
      setValue('hinhAnh', url, { shouldValidate: true });
      toast.success('Tải ảnh thành công!', { id: toastId });
    } catch (error) {
      toast.error('Lỗi khi tải ảnh!', { id: toastId });
    } finally {
      // Reset input file để có thể chọn lại cùng 1 file nếu cần
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Submit Handler
  const onSubmit = async (data: PostFormData, actionType: 'DRAFT' | 'PREVIEW' | 'PUBLISH') => {
    try {
      const payload = {
        ...data,
        trangThai: actionType === 'PUBLISH' ? 'PUBLISHED' : 'DRAFT',
      };

      let postId = id;

      if (isEdit && id) {
        await axiosClient.put(`/admin/posts/${id}`, payload);
        toast.success('Cập nhật bài viết thành công!');
      } else {
        const res: any = await axiosClient.post('/admin/posts', payload);
        // Lấy ID bài viết vừa tạo
        postId = res?.data?.data?.maBV || res?.data?.maBV;
        toast.success('Tạo bài viết mới thành công!');
      }

      // Điều hướng dựa vào action
      if (actionType === 'PREVIEW') {
        navigate(`/admin/posts/preview/${postId}`);
      } else {
        navigate('/admin/posts');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đã xảy ra lỗi khi lưu bài viết';
      toast.error(msg);
    }
  };

  if (isFetching) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#1dbf73]" />
        </div>
      </AdminLayout>
    );
  }

  // Tách onChange của react-hook-form để thêm logic tự sinh slug
  const { onChange: onTitleChange, ...titleRest } = register('tieuDe', { 
    required: 'Tiêu đề không được để trống' 
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/posts')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText size={22} className="text-[#1dbf73]" />
              {isEdit ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit ? 'Cập nhật nội dung bài viết' : 'Tạo một bài viết mới cho hệ thống'}
            </p>
          </div>
        </div>

        {/* Form Grid */}
        <form className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cột chính: Thông tin cơ bản & Nội dung */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tiêu đề, Slug, Tóm tắt */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tiêu đề bài viết <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...titleRest}
                    onChange={(e) => {
                      onTitleChange(e);
                      if (!slugManuallyEdited) {
                        setValue(
                          'slug', 
                          slugify(e.target.value, { lower: true, strict: true, locale: 'vi' }), 
                          { shouldValidate: true }
                        );
                      }
                    }}
                    placeholder="Nhập tiêu đề bài viết..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition"
                  />
                  {errors.tieuDe && <p className="text-red-500 text-xs mt-1">{errors.tieuDe.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Đường dẫn bài viết <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      {...register('slug', { 
                        required: 'Đường dẫn không được để trống',
                        onChange: () => setSlugManuallyEdited(true)
                      })}
                      placeholder="tieu-de-bai-viet"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition"
                    />
                  </div>
                  {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
                  {!slugManuallyEdited && watchTieuDe && (
                    <p className="text-xs text-slate-400 mt-1">
                      Đường dẫn được tự động tạo từ tiêu đề. Bạn có thể chỉnh sửa thủ công nếu muốn.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tóm tắt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('tomTat', { required: 'Tóm tắt không được để trống', maxLength: { value: 500, message: 'Tóm tắt tối đa 500 ký tự' } })}
                    rows={3}
                    placeholder="Nội dung tóm tắt hiển thị ngoài danh sách..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition resize-none"
                  />
                  {errors.tomTat && <p className="text-red-500 text-xs mt-1">{errors.tomTat.message}</p>}
                </div>
              </div>

              {/* Rich Text Editor */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Nội dung bài viết <span className="text-red-500">*</span>
                </label>
                {/* 
                  Wrapper div để overide css của react-quill nếu cần, 
                  đảm bảo editor không bị lùn đi khi thêm content 
                */}
                <div className="prose-quill-wrapper">
                  <Controller
                    name="noiDung"
                    control={control}
                    rules={{ required: 'Nội dung không được để trống' }}
                    render={({ field }) => (
                      <ReactQuill
                        theme="snow"
                        value={field.value}
                        onChange={field.onChange}
                        modules={QUILL_MODULES}
                        formats={QUILL_FORMATS}
                        className="h-[400px] mb-12 rounded-xl"
                        placeholder="Viết nội dung bài viết của bạn ở đây. Có thể dán trực tiếp ảnh từ clipboard..."
                      />
                    )}
                  />
                </div>
                {errors.noiDung && <p className="text-red-500 text-xs mt-1">{errors.noiDung.message}</p>}
              </div>

            </div>

            {/* Cột phụ: Cài đặt ảnh & Trạng thái */}
            <div className="space-y-6">
              
              {/* Ảnh đại diện */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Ảnh đại diện (Thumbnail) <span className="text-red-500">*</span>
                </label>
                <div 
                  className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${watchHinhAnh ? 'border-transparent' : 'border-slate-300 hover:bg-slate-50 hover:border-emerald-400'}`}
                  onClick={() => !watchHinhAnh && fileInputRef.current?.click()}
                >
                  {watchHinhAnh ? (
                    <div className="relative w-full h-full group">
                      <img src={watchHinhAnh} alt="Thumbnail Preview" className="w-full h-full object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 shadow-sm"
                        >
                          Thay đổi ảnh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="mb-1 text-sm text-slate-600"><span className="font-semibold text-emerald-600">Bấm vào đây</span> để tải ảnh lên</p>
                      <p className="text-xs text-slate-400">Hỗ trợ định dạng: SVG, PNG, JPG, GIF</p>
                    </div>
                  )}
                  {/* File input ẩn đi */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </div>
                {/* Ẩn input lưu URL thực tế (kết nối với react-hook-form) */}
                <input type="hidden" {...register('hinhAnh', { required: 'Vui lòng tải lên ảnh đại diện' })} />
                {errors.hinhAnh && <p className="text-red-500 text-xs mt-2">{errors.hinhAnh.message}</p>}
              </div>

              {/* Danh mục bài viết */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Danh mục bài viết
                </label>
                <select
                  {...register('maDMBV', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.maDMBV} value={cat.maDMBV}>
                      {cat.tenDMBV}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cài đặt trạng thái */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Cài đặt trạng thái
                </label>
                <select
                  {...register('trangThai')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition bg-white"
                >
                  <option value="DRAFT">Bản nháp (DRAFT)</option>
                  <option value="PUBLISHED">Xuất bản (PUBLISHED)</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">
                  Trạng thái này sẽ bị ghi đè nếu bạn dùng nút Lưu nháp hoặc Xuất bản.
                </p>
              </div>

              {/* Action Buttons (Đưa lên sidebar) */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
                 <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Thao tác
                </label>
                
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit((data) => onSubmit(data, 'PUBLISH'))}
                  className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-70 shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Xuất bản bài viết
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmit((data) => onSubmit(data, 'DRAFT'))}
                    className="inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-70 shadow-sm"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={14} className="text-slate-500" />}
                    Lưu nháp
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmit((data) => onSubmit(data, 'PREVIEW'))}
                    className="inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-70 shadow-sm"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Eye size={14} className="text-slate-500" />}
                    Xem trước
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/posts')}
                    className="w-full inline-flex justify-center items-center px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>

            </div>
          </div>

        </form>
      </div>
    </AdminLayout>
  );
}
