import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import axiosClient from '../../../api/axios';
import { sanitizeArticleHtml } from '../../../features/student-portal/pages/blog/utils/article';

interface PostPreview {
  tieuDe: string;
  tomTat?: string;
  noiDung?: string;
  hinhAnh?: string;
}

export default function AdminPostPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostPreview | null>(null);

  useEffect(() => {
    axiosClient.get<any>(`/admin/posts/${id}`).then((response) => setPost(response.data));
  }, [id]);

  if (!post) return <AdminLayout><div className="flex justify-center py-32"><Loader2 className="animate-spin text-emerald-600" /></div></AdminLayout>;

  return <AdminLayout><article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="p-6"><button onClick={() => navigate(`/admin/posts/${id}/edit`)} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"><ArrowLeft size={16} />Quay lại chỉnh sửa</button><p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-600">Bản xem trước (chưa xuất bản)</p><h1 className="text-3xl font-bold text-slate-900">{post.tieuDe}</h1>{post.tomTat && <p className="mt-5 border-l-4 border-emerald-500 bg-emerald-50 p-4 italic text-slate-600">{post.tomTat}</p>}</div>{post.hinhAnh && <img src={post.hinhAnh} alt="" className="h-80 w-full object-cover" />}<div className="prose prose-slate max-w-none p-6 md:p-10" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(post.noiDung ?? '') }} /></article></AdminLayout>;
}
