import React from 'react';
import { BookOpen, Target, AlertCircle } from 'lucide-react';

/**
 * Phân tích nội dung ketQuaHocTap / yeuCauKhoaHoc thành mảng string
 * Hỗ trợ: chuỗi JSON mảng, chuỗi HTML chứa <li>, hoặc chuỗi thuần text phân cách bằng dấu xuống dòng
 */
function parseListContent(raw: any): string[] {
  if (!raw) return [];

  // Nếu đã là mảng
  if (Array.isArray(raw)) {
    return raw.map((item: any) => String(item).trim()).filter(Boolean);
  }

  const str = String(raw).trim();
  if (!str) return [];

  // Thử parse JSON array
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Không phải JSON hợp lệ, tiếp tục
    }
  }

  // Thử tách theo thẻ <li>
  if (str.includes('<li>') || str.includes('<li ')) {
    const matches = str.match(/<li[^>]*>(.*?)<\/li>/gi);
    if (matches && matches.length > 0) {
      return matches
        .map(m => m.replace(/<\/?[^>]+(>|$)/g, '').trim())
        .filter(Boolean);
    }
  }

  // Thử tách theo xuống dòng
  if (str.includes('\n')) {
    return str.split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  }

  // Nếu là HTML thuần (có thẻ), trả về mảng 1 phần tử plaintext
  if (str.includes('<')) {
    const plainText = str.replace(/<\/?[^>]+(>|$)/g, '').trim();
    return plainText ? [plainText] : [];
  }

  // Trả về nguyên chuỗi
  return [str];
}

export default function CourseOverview({ courseData }: { courseData: any }) {
  if (!courseData) return null;

  const ketQuaItems = parseListContent(courseData.ketQuaHocTap);
  const yeuCauItems = parseListContent(courseData.yeuCauKhoaHoc);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Mô tả khóa học */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-3">Mô tả khóa học</h3>
        {courseData.moTa ? (
           <div className="text-slate-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: courseData.moTa }}></div>
        ) : (
           <p className="text-slate-400 italic">Khóa học này chưa có mô tả chi tiết.</p>
        )}
      </div>
      
      {/* Mục tiêu đạt được */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Target size={20} className="text-emerald-500" />
          Mục tiêu đạt được
        </h3>
        {ketQuaItems.length > 0 ? (
          <div className="bg-emerald-50/40 rounded-xl p-5 border border-emerald-100">
            <ul className="space-y-3 m-0 p-0 list-none">
              {ketQuaItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-1 shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="text-slate-700 leading-relaxed text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-slate-400 italic text-sm">Giảng viên chưa cập nhật mục tiêu khóa học.</p>
        )}
      </div>

      {/* Yêu cầu đầu vào */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
          <AlertCircle size={20} className="text-blue-500" />
          Yêu cầu đầu vào
        </h3>
        {yeuCauItems.length > 0 ? (
          <div className="bg-blue-50/40 rounded-xl p-5 border border-blue-100">
            <ul className="space-y-3 m-0 p-0 list-none">
              {yeuCauItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-1 shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">•</span>
                  <span className="text-slate-700 leading-relaxed text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-slate-400 italic text-sm">Khóa học này không có yêu cầu đầu vào đặc biệt.</p>
        )}
      </div>
    </div>
  );
}
