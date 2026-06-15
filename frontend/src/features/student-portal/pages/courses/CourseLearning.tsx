import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, PlayCircle, CheckCircle, Video, FileText } from 'lucide-react';
import axiosClient from '../../../../api/axios';

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
    console.error("Invalid URL format:", url);
  }
  
  if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0`;
  
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  return '';
};

export default function CourseLearning() {
  const { id } = useParams<{ id: string }>();
  const [courseName, setCourseName] = useState<string>(`Không gian học tập (Khóa học: ${id})`);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    // Lấy tiến độ từ localStorage (mock) để đồng bộ với StudentProfile
    try {
      const savedCourses = localStorage.getItem('myCourses');
      if (savedCourses) {
        const courses = JSON.parse(savedCourses);
        const currentCourse = courses.find((c: any) => String(c.id) === String(id));
        if (currentCourse && currentCourse.progress) {
          setProgress(currentCourse.progress);
        }
      } else {
        // Fallback mock data
        if (String(id) === '1') setProgress(80);
        if (String(id) === '2') setProgress(45);
      }
    } catch (e) {
      console.error("Error reading progress", e);
    }

    const fetchData = async () => {
      try {
        const [courseRes, curriculumRes] = await Promise.all([
          axiosClient.get(`/public/courses/${id}`),
          axiosClient.get(`/public/courses/${id}/curriculum`)
        ]);

        if (courseRes && (courseRes as any).data) {
          setCourseName((courseRes as any).data.tenKhoaHoc);
        }

        if (curriculumRes && (curriculumRes as any).data) {
          const data = (curriculumRes as any).data;
          setCurriculum(data);
          
          if (data.length > 0) {
            setExpandedModules([data[0].maChuong]);
            if (data[0].baiHocs && data[0].baiHocs.length > 0) {
              setActiveLesson(data[0].baiHocs[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching course data", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-900 text-slate-200 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200">
      {/* Top Navbar */}
      <div className="h-16 bg-slate-950 border-b border-slate-800 flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center gap-4">
          <Link to="/student/profile" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
            <span className="font-medium hidden sm:inline">Trở về bảng điều khiển</span>
          </Link>
          <div className="h-6 w-px bg-slate-700 mx-2 hidden sm:block"></div>
          <h1 className="font-semibold text-white line-clamp-1">{courseName}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">Tiến độ: <span className="text-emerald-400 font-bold">{progress}%</span></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content (Video Player) */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="w-full bg-black aspect-video relative">
            {activeLesson?.videoUrl && getYouTubeEmbedUrl(activeLesson.videoUrl) ? (
              <iframe
                className="w-full h-full absolute inset-0"
                src={getYouTubeEmbedUrl(activeLesson.videoUrl)}
                title="Course Video Player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800">
                <FileText size={64} className="mb-4 text-slate-600" />
                <h3 className="text-xl font-medium text-slate-300">
                  {activeLesson?.videoUrl ? 'Video không hợp lệ' : 'Tài liệu học tập'}
                </h3>
                <p>
                  {activeLesson?.videoUrl ? 'Đường dẫn video bị lỗi hoặc chưa được hỗ trợ.' : 'Vui lòng xem tài liệu bên dưới'}
                </p>
              </div>
            )}
          </div>
          <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-white mb-4">{activeLesson?.tenBaiHoc}</h2>
            {activeLesson?.noiDung ? (
              <div className="text-slate-300 mb-8 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: activeLesson.noiDung }}></div>
            ) : (
              <p className="text-slate-400 mb-8">Bài học này cung cấp những kiến thức cần thiết để bạn nắm vững phần nội dung hiện tại. Hãy chú ý ghi chép và thực hành lại nhé.</p>
            )}
          </div>
        </div>

        {/* Sidebar Curriculum */}
        <div className="w-80 lg:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-lg text-white">Nội dung khóa học</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {curriculum.map(module => (
              <div key={module.maChuong} className="mb-2">
                <button 
                  onClick={() => toggleModule(module.maChuong)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-900 transition-colors text-left"
                >
                  <span className="font-semibold text-slate-300">{module.tenChuong}</span>
                  <span className="text-xs text-slate-500 font-medium">0/{module.baiHocs?.length || 0}</span>
                </button>
                {expandedModules.includes(module.maChuong) && module.baiHocs && (
                  <div className="mt-1 space-y-1">
                    {module.baiHocs.map((lesson: any) => (
                      <button
                        key={lesson.maBH}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                          activeLesson?.maBH === lesson.maBH 
                            ? 'bg-emerald-900/30 border border-emerald-900/50' 
                            : 'hover:bg-slate-900/50 border border-transparent'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {lesson.completed ? (
                            <CheckCircle size={16} className="text-emerald-500" />
                          ) : lesson.videoUrl ? (
                            <PlayCircle size={16} className={activeLesson?.maBH === lesson.maBH ? 'text-emerald-400' : 'text-slate-500'} />
                          ) : (
                            <FileText size={16} className={activeLesson?.maBH === lesson.maBH ? 'text-emerald-400' : 'text-slate-500'} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${activeLesson?.maBH === lesson.maBH ? 'text-emerald-400 font-medium' : 'text-slate-300'}`}>
                            {lesson.tenBaiHoc}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{lesson.videoUrl ? 'Video' : 'Tài liệu'}</span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500">{lesson.thoiLuong ? `${Math.round(lesson.thoiLuong/60)} phút` : ''}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569; 
        }
      `}</style>
    </div>
  );
}
