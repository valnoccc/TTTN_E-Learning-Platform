import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, PlayCircle, CheckCircle, Video, FileText } from 'lucide-react';

const MOCK_CURRICULUM = [
  {
    id: 'm1',
    title: 'Module 1: Giới thiệu khóa học',
    lessons: [
      { id: 'l1', title: 'Chào mừng bạn đến với khóa học', duration: '05:30', type: 'video', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1', completed: true },
      { id: 'l2', title: 'Những gì bạn sẽ đạt được', duration: '12:45', type: 'video', videoUrl: 'https://www.youtube.com/embed/tgbNymZ7vqY', completed: false },
    ]
  },
  {
    id: 'm2',
    title: 'Module 2: Kiến thức nền tảng',
    lessons: [
      { id: 'l3', title: 'Hiểu các khái niệm cốt lõi', duration: '18:20', type: 'video', videoUrl: 'https://www.youtube.com/embed/zpOULjyy-n8', completed: false },
      { id: 'l4', title: 'Bài tập thực hành số 1', duration: '45:00', type: 'document', completed: false },
    ]
  }
];

export default function CourseLearning() {
  const { id } = useParams<{ id: string }>();
  const [activeLesson, setActiveLesson] = useState(MOCK_CURRICULUM[0].lessons[0]);
  const [expandedModules, setExpandedModules] = useState<string[]>(['m1', 'm2']);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    );
  };

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
          <h1 className="font-semibold text-white line-clamp-1">Không gian học tập (Khóa học: {id})</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">Tiến độ: <span className="text-emerald-400 font-bold">25%</span></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content (Video Player) */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="w-full bg-black aspect-video relative">
            {activeLesson.type === 'video' ? (
              <iframe
                className="w-full h-full absolute inset-0"
                src={activeLesson.videoUrl}
                title="Course Video Player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800">
                <FileText size={64} className="mb-4 text-slate-600" />
                <h3 className="text-xl font-medium text-slate-300">Tài liệu học tập</h3>
                <p>Vui lòng xem tài liệu bên dưới</p>
              </div>
            )}
          </div>
          <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-white mb-2">{activeLesson.title}</h2>
            <p className="text-slate-400 mb-8">Bài học này cung cấp những kiến thức cần thiết để bạn nắm vững phần nội dung hiện tại. Hãy chú ý ghi chép và thực hành lại nhé.</p>
          </div>
        </div>

        {/* Sidebar Curriculum */}
        <div className="w-80 lg:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-lg text-white">Nội dung khóa học</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {MOCK_CURRICULUM.map(module => (
              <div key={module.id} className="mb-2">
                <button 
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-900 transition-colors text-left"
                >
                  <span className="font-semibold text-slate-300">{module.title}</span>
                  <span className="text-xs text-slate-500 font-medium">0/{module.lessons.length}</span>
                </button>
                {expandedModules.includes(module.id) && (
                  <div className="mt-1 space-y-1">
                    {module.lessons.map(lesson => (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson as any)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                          activeLesson.id === lesson.id 
                            ? 'bg-emerald-900/30 border border-emerald-900/50' 
                            : 'hover:bg-slate-900/50 border border-transparent'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {lesson.completed ? (
                            <CheckCircle size={16} className="text-emerald-500" />
                          ) : lesson.type === 'video' ? (
                            <PlayCircle size={16} className={activeLesson.id === lesson.id ? 'text-emerald-400' : 'text-slate-500'} />
                          ) : (
                            <FileText size={16} className={activeLesson.id === lesson.id ? 'text-emerald-400' : 'text-slate-500'} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${activeLesson.id === lesson.id ? 'text-emerald-400 font-medium' : 'text-slate-300'}`}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{lesson.type === 'video' ? 'Video' : 'Tài liệu'}</span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500">{lesson.duration}</span>
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
