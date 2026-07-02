import React, { useEffect, useState } from 'react';
import { Target, AlertCircle, Star, Globe, CalendarDays, Check } from 'lucide-react';
import axiosClient from '../../../../../api/axios';
import LearningReminderModal from './LearningReminderModal';

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

function formatDateToMonthYear(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return `tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
}

export default function CourseOverview({ courseData, curriculum }: { courseData: any, curriculum?: any[] }) {
  const [reviewStats, setReviewStats] = useState({ avgRating: 5.0, totalReviews: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      const id = courseData?.maKH || courseData?.id;
      if (!id) return;
      try {
        const response: any = await axiosClient.get(`/public/courses/${id}/reviews`);
        if (response && response.data) {
          const fetchedData = response.data;
          let totalRating = 0;
          let validReviews = 0;
          fetchedData.forEach((r: any) => {
            if (r.rating > 0) {
              totalRating += r.rating;
              validReviews++;
            }
          });
          const avgRating = validReviews > 0 ? (totalRating / validReviews).toFixed(1) : 5.0;
          setReviewStats({ avgRating: Number(avgRating), totalReviews: fetchedData.length });
        }
      } catch (error) {
        console.error("Error fetching reviews", error);
      }
    };
    fetchReviews();
  }, [courseData]);

  if (!courseData) return null;

  const ketQuaItems = parseListContent(courseData.ketQuaHocTap);
  const yeuCauItems = parseListContent(courseData.yeuCauKhoaHoc);
  
  // Tính toán số liệu thực tế
  let totalLessons = 0;
  let totalDurationSec = 0;
  
  if (curriculum && Array.isArray(curriculum)) {
    curriculum.forEach(chap => {
      if (chap.baiHocs && Array.isArray(chap.baiHocs)) {
        totalLessons += chap.baiHocs.length;
        chap.baiHocs.forEach((bai: any) => {
          totalDurationSec += (bai.thoiLuong || 0);
        });
      }
    });
  }

  const lastUpdated = courseData.updatedAt || courseData.ngayCapNhat ? formatDateToMonthYear(courseData.updatedAt || courseData.ngayCapNhat) : '';
  const rating = reviewStats.avgRating;
  const numReviews = reviewStats.totalReviews;
  const numStudents = courseData.totalStudents || courseData.soHocVien || courseData.luotDangKy || 0;
  
  // Hiển thị giờ (nếu < 1 giờ thì hiển thị phút, nếu không thì hiển thị giờ lẻ)
  let timeString = '0 phút';
  if (totalDurationSec > 0) {
    if (totalDurationSec < 3600) {
      timeString = `${Math.round(totalDurationSec / 60)} phút`;
    } else {
      timeString = `${(totalDurationSec / 3600).toFixed(1)} giờ`;
    }
  } else if (courseData.tongThoiLuong) {
    if (courseData.tongThoiLuong < 3600) {
      timeString = `${Math.round(courseData.tongThoiLuong / 60)} phút`;
    } else {
      timeString = `${(courseData.tongThoiLuong / 3600).toFixed(1)} giờ`;
    }
  }

  const displayLessons = totalLessons || courseData.baiHocs?.length || 0;

  return (
    <div className="space-y-10 animate-fade-in max-w-4xl">
      {/* 1. Header Information */}
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight">
          {courseData.tenKhoaHoc}
        </h2>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600 pt-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-amber-500 text-base">{rating}</span>
            <Star size={16} className="text-amber-500 fill-amber-500" />
            <span className="text-slate-500 hover:text-slate-900 cursor-pointer underline underline-offset-2 ml-1">
              ({numReviews} xếp hạng)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">{numStudents}</span> Học viên
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">{timeString}</span> Tổng số
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 pt-2">
          {lastUpdated && (
            <div className="flex items-center gap-1.5">
              <AlertCircle size={16} />
              Lần cập nhật gần đây nhất {lastUpdated}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Globe size={16} />
            Tiếng Việt
          </div>
        </div>
      </div>

      {/* 2. Banner "Lên lịch thời gian học" */}
      <div className="border border-slate-300 rounded-xl p-6 flex flex-col sm:flex-row gap-5 bg-white shadow-sm">
        <div className="mt-1 shrink-0">
          <CalendarDays size={32} className="text-slate-700" />
        </div>
        <div className="flex-1 space-y-3">
          <h3 className="font-bold text-slate-800 text-lg">Lên lịch thời gian học</h3>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            Học một chút mỗi ngày sẽ giúp bạn tích lũy kiến thức. Nghiên cứu cho thấy rằng những học viên biến việc học thành thói quen sẽ có nhiều khả năng đạt được mục tiêu hơn. Hãy dành thời gian để học và nhận lời nhắc bằng cách sử dụng trình lên lịch học tập.
          </p>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 border border-slate-700 font-bold text-slate-800 text-sm hover:bg-slate-100 transition-colors"
            >
              Bắt đầu
            </button>
            <button className="px-5 py-2.5 font-bold text-slate-600 text-sm hover:text-slate-900 transition-colors">
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>

      {/* 3. Specs Sections */}
      <div className="space-y-0 divide-y divide-slate-200 border-y border-slate-200">
        
        {/* Theo số liệu */}
        <div className="py-6 flex flex-col md:flex-row gap-4 md:gap-10">
          <div className="w-48 shrink-0 font-medium text-slate-800">Theo số liệu</div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-slate-600">
            <div>Trình độ kỹ năng: Tất cả các cấp độ</div>
            <div>Bài giảng: {displayLessons}</div>
            <div>Học viên: {numStudents}</div>
            <div>Video: Tổng số {timeString}</div>
            <div>Ngôn ngữ: Tiếng Việt</div>
            <div>Phụ đề: Không</div>
          </div>
        </div>

        {/* Giấy chứng nhận */}
        <div className="py-6 flex flex-col md:flex-row gap-4 md:gap-10">
          <div className="w-48 shrink-0 font-medium text-slate-800">Giấy chứng nhận</div>
          <div className="flex-1 space-y-3 text-sm text-slate-600">
            <p>Nhận giấy chứng nhận Edumeo bằng cách hoàn thành toàn bộ khóa học</p>
            <button className="px-5 py-2.5 border border-slate-300 font-bold text-slate-400 text-sm cursor-not-allowed hover:bg-slate-50 transition-colors rounded-sm inline-flex items-center gap-2">
              Giấy chứng nhận Edumeo
            </button>
          </div>
        </div>

        {/* Mô tả */}
        <div className="py-6 flex flex-col md:flex-row gap-4 md:gap-10">
          <div className="w-48 shrink-0 font-medium text-slate-800">Mô tả</div>
          <div className="flex-1 text-sm text-slate-700">
             {courseData.moTa ? (
               <div className="leading-relaxed prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: courseData.moTa }}></div>
            ) : (
               <p className="text-slate-400 italic">Khóa học này chưa có mô tả chi tiết.</p>
            )}
          </div>
        </div>

      </div>
      
      {/* 4. Mục tiêu đạt được (Giữ lại từ code cũ vì nó hữu ích) */}
      {ketQuaItems.length > 0 && (
        <div className="pt-2">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            Mục tiêu đạt được
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ketQuaItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-slate-700"><Check size={20} /></span>
                <span className="text-slate-600 text-sm leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Yêu cầu đầu vào (Giữ lại từ code cũ) */}
      {yeuCauItems.length > 0 && (
        <div className="pt-2 pb-10">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            Yêu cầu đầu vào
          </h3>
          <ul className="space-y-3 m-0 p-0 list-none ml-2">
            {yeuCauItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-2.5 shrink-0 w-1.5 h-1.5 rounded-full bg-slate-700 block"></span>
                <span className="text-slate-600 text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isModalOpen && (
        <LearningReminderModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => setIsModalOpen(false)}
          currentCourseId={String(courseData?.maKH || courseData?.id || '')}
          currentCourseName={courseData?.tenKhoaHoc || ''}
        />
      )}
    </div>
  );
}
