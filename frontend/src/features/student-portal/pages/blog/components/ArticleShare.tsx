import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ArticleShareProps {
  title: string;
}

export default function ArticleShare({ title }: ArticleShareProps) {
  const url = window.location.href;

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    
    // Fallback if Web Share API is not supported (e.g. Firefox Desktop)
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Đã sao chép liên kết bài viết!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void shareNative()}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors bg-white shadow-sm"
        aria-label="Chia sẻ bài viết"
      >
        <Share2 size={16} />
        Chia sẻ liên kết
      </button>
    </div>
  );
}
