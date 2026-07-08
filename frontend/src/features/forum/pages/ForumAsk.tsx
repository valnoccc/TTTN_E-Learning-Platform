import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axiosClient from '../../../api/axios';
import { toast } from 'react-hot-toast';

export default function ForumAsk() {
  const navigate = useNavigate();
  const [tieuDe, setTieuDe] = useState('');
  const [noiDung, setNoiDung] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const quillRef = useRef<ReactQuill>(null);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tieuDe.trim() || !noiDung.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    setIsSubmitting(true);
    try {
      const response: any = await axiosClient.post('/forum/questions', {
        tieuDe,
        noiDung,
        tags,
      });
      toast.success('Đăng câu hỏi thành công!');
      navigate(`/forum`); // go back to forum home
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Có lỗi xảy ra khi tạo câu hỏi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image handler for Quill
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        const uploadToast = toast.loading('Đang tải ảnh lên...');
        try {
          const res: any = await axiosClient.post('/forum/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          // Insert image to editor
          const editor = quillRef.current?.getEditor();
          if (editor && res.url) {
            const range = editor.getSelection(true);
            editor.insertEmbed(range.index, 'image', res.url);
          }
          toast.success('Tải ảnh lên thành công', { id: uploadToast });
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Tải ảnh thất bại', { id: uploadToast });
        }
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), []);

  return (
    <div className="min-h-screen bg-[#f1f2f3]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Đặt câu hỏi</h1>
        </div>

        <div className="bg-[#fdf7e2] border border-[#e6c152] p-4 rounded mb-6 text-sm text-gray-800">
          <h2 className="font-semibold text-base mb-2">Viết một câu hỏi tốt</h2>
          <p className="mb-2">
            Bạn đã sẵn sàng đặt câu hỏi liên quan đến học tập/lập trình, mẫu biểu này sẽ giúp bạn.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tóm tắt vấn đề trong một tiêu đề gồm 1 dòng.</li>
            <li>Mô tả chi tiết vấn đề bạn gặp phải.</li>
            <li>Mô tả những gì bạn đã thử và những gì bạn mong đợi sẽ xảy ra.</li>
            <li>Thêm "tags" giúp bề mặt câu hỏi tốt hơn với những thành viên khác.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white border border-gray-300 rounded p-6 shadow-sm">
            <div className="mb-4">
              <label className="block text-[15px] font-semibold text-gray-900 mb-1">
                Tiêu đề
              </label>
              <p className="text-xs text-gray-500 mb-2">Cụ thể và tưởng tượng bạn đang đặt câu hỏi cho người khác.</p>
              <input
                type="text"
                placeholder="VD: Làm sao để setup TypeORM với NestJS..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0a95ff] focus:ring-4 focus:ring-[#0a95ff]/10 transition"
                value={tieuDe}
                onChange={(e) => setTieuDe(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-[15px] font-semibold text-gray-900 mb-1">
                Chi tiết vấn đề của bạn là gì?
              </label>
              <p className="text-xs text-gray-500 mb-2">Cung cấp tất cả chi tiết và đính kèm hình ảnh (nếu có).</p>
              <div className="bg-white h-[250px] mb-12">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={noiDung}
                  onChange={setNoiDung}
                  modules={modules}
                  className="h-full"
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-[15px] font-semibold text-gray-900 mb-1">
                Thẻ (Tags)
              </label>
              <p className="text-xs text-gray-500 mb-2">Thêm tối đa 5 thẻ để mô tả nội dung câu hỏi của bạn. Nhấn Enter để thêm.</p>
              
              <div className="w-full border border-gray-300 rounded p-2 text-sm focus-within:border-[#0a95ff] focus-within:ring-4 focus-within:ring-[#0a95ff]/10 transition min-h-[42px] flex flex-wrap gap-2 items-center">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-[#e1ecf4] text-[#39739d] px-2 py-1 rounded text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 rounded-full w-4 h-4 flex items-center justify-center font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="flex-1 min-w-[120px] focus:outline-none bg-transparent"
                  placeholder={tags.length < 5 ? "Nhập tag (VD: javascript)" : ""}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  disabled={tags.length >= 5}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0a95ff] hover:bg-[#0074cc] text-white px-4 py-2 rounded text-sm font-medium shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi...' : 'Đăng câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
