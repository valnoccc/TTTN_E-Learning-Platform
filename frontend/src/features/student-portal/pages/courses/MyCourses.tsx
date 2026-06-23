import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlayCircle, Clock, Award, Search } from 'lucide-react';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import axiosClient from '../../../../api/axios';

export default function MyCourses() {
  const navigate = useNavigate();
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      const userString = localStorage.getItem('user');
      if (!userString) {
        navigate('/login');
        return;
      }

      try {
        const user = JSON.parse(userString);
        const userId = user.id || user.maND || user.sub;
        if (userId) {
          const res: any = await axiosClient.get(`/users/${userId}/courses`);
          setMyCourses(res?.data ?? res ?? []);
        }
      } catch (e) {
        console.error('Lỗi khi tải khóa học đã đăng ký', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [navigate]);

  const filteredCourses = myCourses.filter((course) =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedCount = myCourses.filter((c) => c.progress >= 100).length;
  const inProgressCount = myCourses.filter((c) => c.progress > 0 && c.progress < 100).length;
  const notStartedCount = myCourses.filter((c) => c.progress === 0).length;

  return (
    <div className="my-courses-page bg-slate-50 min-h-screen pb-16">
      <BreadcrumbBox title="Khóa học của tôi" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookOpen size={22} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng khóa học</p>
              <p className="text-2xl font-bold text-slate-800">{myCourses.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={22} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Đang học</p>
              <p className="text-2xl font-bold text-slate-800">{inProgressCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Award size={22} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Hoàn thành</p>
              <p className="text-2xl font-bold text-slate-800">{completedCount}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm trong khóa học của bạn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm"
          />
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              {searchTerm ? 'Không tìm thấy khóa học' : 'Chưa có khóa học nào'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Hãy khám phá và đăng ký khóa học để bắt đầu hành trình học tập!'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/course-grid')}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Khám phá khóa học
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                onClick={() => navigate(`/student/learn/${course.id}`)}
              >
                {/* Course Thumbnail */}
                <div className="h-44 bg-slate-200 overflow-hidden relative">
                  {course.image ? (
                    <img
                      src={
                        course.image.startsWith('http')
                          ? course.image
                          : `${process.env.PUBLIC_URL || ''}/assets/images/${course.image.replace(/^\/?\/?/, '')}`
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e: any) => {
                        e.target.src = `${process.env.PUBLIC_URL || ''}/assets/images/course-1.jpg`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400">
                      <BookOpen size={40} />
                    </div>
                  )}
                  {/* Progress Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                        course.progress >= 100
                          ? 'bg-emerald-500/90 text-white'
                          : course.progress > 0
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-slate-500/80 text-white'
                      }`}
                    >
                      {course.progress >= 100 ? 'Hoàn thành' : course.progress > 0 ? 'Đang học' : 'Chưa bắt đầu'}
                    </span>
                  </div>
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <PlayCircle
                      size={48}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg"
                    />
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-5">
                  <h4 className="font-bold text-slate-800 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {course.title}
                  </h4>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-500">Tiến độ</span>
                      <span className="font-semibold text-emerald-600">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${course.progress}%`,
                          background:
                            course.progress >= 100
                              ? 'linear-gradient(90deg, #10b981, #059669)'
                              : course.progress > 0
                                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                : '#cbd5e1',
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/learn/${course.id}`);
                    }}
                    className="w-full py-2.5 bg-emerald-50 text-emerald-700 font-medium rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <PlayCircle size={16} />
                    {course.progress >= 100 ? 'Ôn tập lại' : course.progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
