import React from 'react';

export default function CourseOverview({ courseData }: { courseData: any }) {
  if (!courseData) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-3">Mô tả khóa học</h3>
        {courseData.moTa ? (
           <div className="text-slate-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: courseData.moTa }}></div>
        ) : (
           <p className="text-slate-500 italic">Chưa có mô tả cho khóa học này.</p>
        )}
      </div>
      
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-3">Mục tiêu đạt được</h3>
        {courseData.ketQuaHocTap ? (
           <div className="text-slate-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: courseData.ketQuaHocTap }}></div>
        ) : (
           <p className="text-slate-500 italic">Chưa có thông tin.</p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-3">Yêu cầu đầu vào</h3>
        {courseData.yeuCauKhoaHoc ? (
           <div className="text-slate-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: courseData.yeuCauKhoaHoc }}></div>
        ) : (
           <p className="text-slate-500 italic">Không có yêu cầu đặc biệt.</p>
        )}
      </div>
    </div>
  );
}
