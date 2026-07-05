import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, PlayCircle, CheckCircle, FileText, BookOpen, Share2 } from 'lucide-react';
import axiosClient from '../../../../api/axios';
import CourseOverview from './components/CourseOverview';
import CourseQA from './components/CourseQA';
import CourseReviews from './components/CourseReviews';
import CourseLearningTools from './components/CourseLearningTools';
import CustomVideoPlayer, { VideoPlaceholder } from './components/CustomVideoPlayer';
import FooterTwo from '../../components/FooterTwo';

const CourseCompletedScreen = () => {
  return (
    <div className="w-full h-full min-h-[500px] bg-white flex flex-col items-center justify-center absolute inset-0 z-10">
      <h2 className="font-bold text-gray-800 text-2xl md:text-3xl mb-6">🙌 Chúc mừng bạn đã hoàn thành khóa học!</h2>
      <Link 
        to="/course-grid" 
        className="bg-transparent border border-purple-600 text-purple-600 rounded-md px-6 py-2 hover:bg-purple-50 transition-colors font-semibold"
      >
        Tìm thêm khóa học
      </Link>
    </div>
  );
};

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;

  let videoId = '';
  try {
    if (url.includes('youtube.com/watch')) {
      videoId = new URLSearchParams(new URL(url).search).get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
  } catch (e) {
    console.error('Invalid URL format:', url);
  }

  if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return '';
};

// ─── Helper: Lưu bài học gần nhất lên server (fail-safe) ──────────────────────
const saveCurrentLessonSilently = async (courseId: string, lessonId: number) => {
  try {
    await axiosClient.patch(`/users/me/courses/${courseId}/current-lesson`, { lessonId });
    console.log(`[CourseLearning] Đã lưu bài học gần nhất: courseId=${courseId}, lessonId=${lessonId}`);
  } catch (err) {
    // Fail-safe: không hiện lỗi cho người dùng
    console.warn('[CourseLearning] Không thể lưu bài học gần nhất (silent fail):', err);
  }
};

export default function CourseLearning() {
  const { id } = useParams<{ id: string }>();
  const [courseName, setCourseName] = useState<string>(`Không gian học tập (Khóa học: ${id})`);
  const [courseData, setCourseData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number>(0);
  const [isCourseCompleted, setIsCourseCompleted] = useState<boolean>(false);
  // Banner "Tiếp tục học" – hiển thị khi có bài học gần nhất
  const [resumeBanner, setResumeBanner] = useState<{ lesson: any; module: any } | null>(null);
  // Ref tránh lưu lần đầu khi vừa restore
  const isFirstMount = useRef(true);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    let userId = '';
    if (userString) {
      try {
        const parsedUser = JSON.parse(userString);
        userId = parsedUser.id || parsedUser.maND || parsedUser.sub;
      } catch (e) {
        console.error('Error reading user', e);
      }
    }

    const fetchData = async () => {
      try {
        // ─── Bước 1: Lấy dữ liệu khóa học & chương mục ──────────────────────
        // Thêm .catch() vào từng Promise để nếu 1 API lỗi (VD: 404, 401) thì các API khác vẫn load được
        const [courseRes, curriculumRes, progressRes, completedLessonsRes] = await Promise.all([
          axiosClient.get(`/public/courses/${id}`).catch((e) => {
            console.error('>>> [API Error] Lỗi tải khóa học:', e);
            return null;
          }),
          axiosClient.get(`/public/courses/${id}/curriculum`).catch((e) => {
            console.error('>>> [API Error] Lỗi tải chương mục:', e);
            return null;
          }),
          userId ? axiosClient.get(`/users/me/courses`).catch((e) => {
            console.error('>>> [API Error] Lỗi tải my courses:', e);
            return null;
          }) : Promise.resolve([]),
          userId ? axiosClient.get(`/users/me/progress`).catch((e) => {
            console.error('>>> [API Error] Lỗi tải progress:', e);
            return null;
          }) : Promise.resolve([]),
        ]);

        console.log(">>> [DEBUG RAW] courseRes:", courseRes);
        console.log(">>> [DEBUG RAW] curriculumRes:", curriculumRes);

        const extractArray = (res: any): any[] => {
          if (!res) return [];
          
          // 1. Nếu là cấu trúc của Axios bọc kết quả NestJS: res.data.data
          if (res.data && res.data.data && Array.isArray(res.data.data)) {
            console.log(">>> [FIXED] Đã tìm thấy mảng tại res.data.data:", res.data.data);
            return res.data.data;
          }
          
          // 2. Nếu Axios đã unwrap và chỉ còn kết quả NestJS: res.data
          if (res.data && Array.isArray(res.data)) {
            console.log(">>> [FIXED] Đã tìm thấy mảng tại res.data:", res.data);
            return res.data;
          }
          
          // 3. Fallback các trường hợp khác
          if (Array.isArray(res)) return res;
          return [];
        };

        const extractObject = (res: any): any => {
          if (!res) return null;
          if (res.data && res.data.data && !Array.isArray(res.data.data)) return res.data.data;
          if (res.data && !Array.isArray(res.data)) return res.data;
          return res;
        };

        // Un-wrap data in case axios interceptor stripped .data or deeply nested it
        const actualCourseData = extractObject(courseRes);
        if (actualCourseData && actualCourseData.tenKhoaHoc) {
          setCourseName(actualCourseData.tenKhoaHoc);
          setCourseData(actualCourseData);
        }

        let builtCurriculum: any[] = [];
        const finalCurriculum = extractArray(curriculumRes);

        if (finalCurriculum.length > 0) {
          const completedLessonIds = extractArray(completedLessonsRes);

          const data = finalCurriculum.map((module: any) => ({
            ...module,
            baiHocs: module.baiHocs?.map((lesson: any) => ({
              ...lesson,
              completed: completedLessonIds.includes(lesson.maBH),
            })),
          }));

          builtCurriculum = data;
          setCurriculum(data);
        }

        // ─── Bước 2: SAU KHI curriculum đã sẵn, lấy bài học gần nhất ─────────
        // (sequential, không dùng Promise.all để tránh race condition)
        let lastLessonId: number | null = null;

        if (userId && builtCurriculum.length > 0) {
          try {
            // axiosClient interceptor trả về response.data trực tiếp
            const lastLessonRes: any = await axiosClient.get(`/users/me/courses/${id}/current-lesson`);

            console.log('>>> Dữ liệu bài học gần nhất bốc từ NestJS:', lastLessonRes);

            // Thử nhiều dạng response để chắc chắn lấy được giá trị
            const raw =
              lastLessonRes?.lastLessonId ??       // axiosClient đã unwrap → { lastLessonId }
              lastLessonRes?.data?.lastLessonId ??  // backup nếu chưa unwrap
              lastLessonRes?.MaBaiHocGanNhat ??     // trường hợp backend trả raw column
              null;

            lastLessonId = raw !== null && raw !== undefined ? Number(raw) : null;
            console.log('>>> lastLessonId sau khi parse:', lastLessonId, '| kiểu:', typeof lastLessonId);
          } catch (err) {
            console.warn('[CourseLearning] Không lấy được bài học gần nhất (fail-safe):', err);
          }
        }

        // ─── Bước 3: Khôi phục bài học gần nhất ─────────────────────────────
        let restored = false;

        if (lastLessonId && builtCurriculum.length > 0) {
          for (const module of builtCurriculum) {
            // Ép Number() cả hai phía để tránh lệch kiểu string vs number
            const foundLesson = module.baiHocs?.find(
              (l: any) => Number(l.maBH) === Number(lastLessonId),
            );

            if (foundLesson) {
              console.log(
                '>>> Khôi phục thành công bài học cũ ID:', lastLessonId,
                '| Tên:', foundLesson.tenBaiHoc,
                '| Chương:', module.tenChuong,
              );
              setActiveLesson(foundLesson);
              setExpandedModules([module.maChuong]);

              const isFirstLesson = Number(builtCurriculum[0]?.baiHocs?.[0]?.maBH) === Number(lastLessonId);
              if (!isFirstLesson) {
                setResumeBanner({ lesson: foundLesson, module });
              }
              restored = true;
              break;
            }
          }

          if (!restored) {
            console.warn('>>> lastLessonId', lastLessonId, 'không tìm thấy trong curriculum – fallback bài đầu');
          }
        }

        // ─── Fallback: bài đầu tiên của chương 1 ─────────────────────────────
        if (!restored && builtCurriculum.length > 0) {
          setExpandedModules([builtCurriculum[0].maChuong]);
          if (builtCurriculum[0].baiHocs && builtCurriculum[0].baiHocs.length > 0) {
            setActiveLesson(builtCurriculum[0].baiHocs[0]);
          }
        }

        // ─── Cập nhật progress % ──────────────────────────────────────────────
        const myCourses = Array.isArray(progressRes) ? progressRes : (progressRes as any)?.data;
        if (myCourses && Array.isArray(myCourses)) {
          const currentCourse = myCourses.find((c: any) => String(c.id) === String(id));

          if (currentCourse) {
            setProgress(currentCourse.progress || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching course data', error);
      } finally {
        setLoading(false);
        // Sau khi mount xong mới cho phép lưu
        setTimeout(() => { isFirstMount.current = false; }, 500);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId],
    );
  };

  // ─── Flatten all lessons for prev/next navigation ──────────────────────────
  const allLessons = curriculum.flatMap((m: any) => m.baiHocs ?? []);
  const activeLessonIndex = allLessons.findIndex((l: any) => l.maBH === activeLesson?.maBH);
  const nextLesson = activeLessonIndex >= 0 && activeLessonIndex < allLessons.length - 1
    ? allLessons[activeLessonIndex + 1]
    : null;
  const prevLesson = activeLessonIndex > 0 ? allLessons[activeLessonIndex - 1] : null;

  // ─── Khi học viên click chuyển bài ────────────────────────────────────────
  const handleLessonClick = (lesson: any) => {
    setActiveLesson(lesson);
    setIsCourseCompleted(false);
    // Auto-expand module containing this lesson
    const parentModule = curriculum.find((m: any) =>
      m.baiHocs?.some((l: any) => l.maBH === lesson.maBH)
    );
    if (parentModule) setExpandedModules([parentModule.maChuong]);
    setResumeBanner(null);
    if (id && lesson.maBH) {
      saveCurrentLessonSilently(id, lesson.maBH);
    }
  };

  const handleNextLesson = () => { if (nextLesson) handleLessonClick(nextLesson); };
  const handlePrevLesson = () => { if (prevLesson) handleLessonClick(prevLesson); };

  const handleVideoEnded = async () => {
    if (!activeLesson) return;

    try {
      const userString = localStorage.getItem('user');
      if (!userString) return;
      const parsedUser = JSON.parse(userString);
      const userId = parsedUser.id || parsedUser.maND || parsedUser.sub;
      if (!userId) return;

      // Đánh dấu hoàn thành bài học
      await axiosClient.post(`/users/me/lessons/${activeLesson.maBH}/complete`);

      // Cập nhật local state
      setCurriculum(prev =>
        prev.map(m => ({
          ...m,
          baiHocs: m.baiHocs?.map((l: any) =>
            l.maBH === activeLesson.maBH ? { ...l, completed: true } : l,
          ),
        })),
      );

      // Refetch progress %
      const progressRes = await axiosClient.get(`/users/me/courses`);
      
      const extractArray = (res: any): any[] => {
        if (!res) return [];
        if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
        if (res.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
        return [];
      };

      const myCourses = extractArray(progressRes);
      if (myCourses && Array.isArray(myCourses)) {
        const currentCourse = myCourses.find((c: any) => String(c.id) === String(id));
        if (currentCourse) {
          setProgress(currentCourse.progress || 0);
        }
      }
    } catch (error) {
      console.error('Error updating lesson progress', error);
    }

    if (!nextLesson) {
      setIsCourseCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-900 text-slate-200 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'qa', label: 'Hỏi đáp' },
    { id: 'reviews', label: 'Đánh giá' },
    { id: 'learning-tools', label: 'Công cụ học tập' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-200" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <div className="h-16 bg-slate-950 border-b border-slate-800 flex items-center px-4 shrink-0 justify-between z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <Link to="/student/profile" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
            <span className="font-medium hidden sm:inline">Trở về</span>
          </Link>
          <div className="h-6 w-px bg-slate-700 mx-2 hidden sm:block"></div>
          <h1 className="font-semibold text-white line-clamp-1 hidden md:block">{courseName}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400 hidden sm:block">Tiến độ: <span className="text-emerald-400 font-bold">{progress}%</span></div>
          <button className="flex items-center gap-2 text-sm font-medium border border-slate-700 px-3 py-1.5 hover:bg-slate-800 transition-colors">
            <span className="hidden sm:inline">Chia sẻ</span>
            <Share2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col lg:flex-row bg-white" style={{ flexGrow: 1, alignItems: 'stretch' }}>
        <div className="flex-1 flex flex-col min-w-0">
          {/* ── Custom Video Player ─────────────────────────────────────── */}
          <div className="w-full bg-black aspect-video lg:max-h-[70vh] relative shrink-0 overflow-hidden">
            {isCourseCompleted ? (
              <CourseCompletedScreen />
            ) : activeLesson?.videoUrl && !activeLesson.videoUrl.includes('youtube.com') && !activeLesson.videoUrl.includes('youtu.be') ? (
              <CustomVideoPlayer
                key={activeLesson.maBH}
                src={activeLesson.videoUrl}
                nextLessonName={nextLesson?.tenBaiHoc}
                onEnded={handleVideoEnded}
                onNextLesson={handleNextLesson}
                onPrevLesson={handlePrevLesson}
                hasPrev={!!prevLesson}
                hasNext={!!nextLesson}
              />
            ) : activeLesson?.videoUrl ? (
              // YouTube fallback (iframe)
              <iframe
                src={`https://www.youtube.com/embed/${activeLesson.videoUrl.includes('youtu.be/')
                  ? activeLesson.videoUrl.split('youtu.be/')[1]?.split('?')[0]
                  : new URLSearchParams(new URL(activeLesson.videoUrl).search).get('v') ?? ''
                }?rel=0`}
                className="w-full h-full absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={activeLesson?.tenBaiHoc ?? 'Video bài học'}
              />
            ) : (
              <VideoPlaceholder
                message={activeLesson ? 'Tài liệu học tập' : 'Chọn bài học để bắt đầu'}
              />
            )}
          </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white sticky top-0 z-10 px-4 sm:px-6 md:px-10 shrink-0 shadow-sm">
          <div className="flex gap-6 overflow-x-auto custom-scrollbar pt-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 font-semibold whitespace-nowrap border-b-2 transition-all duration-300 outline-none focus:outline-none ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full flex-1 pb-24">


          {activeTab === 'overview' && <CourseOverview courseData={courseData} curriculum={curriculum} />}
          {activeTab === 'qa' && <CourseQA courseId={id || ''} currentLesson={activeLesson} />}
          {activeTab === 'reviews' && <CourseReviews courseId={id || ''} />}
          {activeTab === 'learning-tools' && <CourseLearningTools courseId={id || ''} courseName={courseName || ''} />}

          <div className="w-full h-40 clear-both" style={{ height: '160px' }}></div>
        </div>
        </div>

        {/* Right Side (Curriculum Sidebar) */}
        <div className="w-full lg:w-96 lg:min-w-[24rem] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col lg:max-h-[calc(100vh-64px)] lg:sticky lg:top-16">
          <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between shadow-sm">
            <h3 className="font-bold text-lg text-slate-800">Nội dung khóa học</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
            {/* ─── Banner "Tiếp tục học" ─────────────────────────────────── */}
            {resumeBanner && (
              <div className="m-4 flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <BookOpen size={20} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-800">Tiếp tục học</p>
                  <p className="text-xs text-emerald-600 truncate">
                    {resumeBanner.lesson.tenBaiHoc}
                  </p>
                </div>
                <button
                  onClick={() => setResumeBanner(null)}
                  className="flex-shrink-0 text-emerald-400 hover:text-emerald-600 text-xl leading-none"
                  aria-label="Đóng banner"
                >
                  ×
                </button>
              </div>
            )}

            {/* ─── Danh sách bài học ────────────────────────────────────── */}
            <div className="bg-slate-50">
              {curriculum && curriculum.length > 0 ? (
                curriculum.map(module => (
                  <div key={module.maChuong} className="border-b border-slate-200 last:border-0">
                    <button
                      onClick={() => toggleModule(module.maChuong)}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="font-semibold text-slate-800 text-sm">{module.tenChuong}</span>
                      <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-2">0/{module.baiHocs?.length || 0}</span>
                    </button>
                    {expandedModules.includes(module.maChuong) && module.baiHocs && (
                      <div className="bg-slate-50 p-2 space-y-1 border-t border-slate-100">
                        {module.baiHocs.map((lesson: any) => (
                          <button
                            key={lesson.maBH}
                            onClick={() => handleLessonClick(lesson)}
                            className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                              activeLesson?.maBH === lesson.maBH
                                ? 'bg-emerald-50 border border-emerald-200'
                                : 'hover:bg-white border border-transparent'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {lesson.completed ? (
                                <CheckCircle size={16} className="text-emerald-500" />
                              ) : lesson.videoUrl ? (
                                <PlayCircle size={16} className={activeLesson?.maBH === lesson.maBH ? 'text-emerald-500' : 'text-slate-400'} />
                              ) : (
                                <FileText size={16} className={activeLesson?.maBH === lesson.maBH ? 'text-emerald-500' : 'text-slate-400'} />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${activeLesson?.maBH === lesson.maBH ? 'text-emerald-600 font-bold' : 'text-slate-700 font-medium'}`}>
                                {lesson.tenBaiHoc}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500">{lesson.videoUrl ? 'Video' : 'Tài liệu'}</span>
                                {lesson.thoiLuong && (
                                  <>
                                    <span className="text-xs text-slate-400">•</span>
                                    <span className="text-xs text-slate-500">{Math.round(lesson.thoiLuong / 60)} phút</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center p-3 text-sm text-slate-500">Đang tải danh sách bài học hoặc dữ liệu trống...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', bottom: 'auto', zIndex: 10, width: '100%' }}>
        <FooterTwo />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}
