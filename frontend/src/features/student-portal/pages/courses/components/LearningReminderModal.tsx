import React, { useState } from 'react';
import { X, Search, Check, Clock } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axiosClient from '../../../../../api/axios';
import { toast } from 'react-hot-toast';

interface LearningReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCourseId: string;
  currentCourseName: string;
}

export default function LearningReminderModal({ isOpen, onClose, onSuccess, currentCourseId, currentCourseName }: LearningReminderModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [googleSynced, setGoogleSynced] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  
  const [form, setForm] = useState({
    tenNhacNho: 'Nhắc nhở học tập',
    courseId: currentCourseId,
    tanSuat: 'HANG_TUAN',
    thoiGian: '12:00',
    cacThu: ['T2'],
    ngayCuThe: '',
  });

  if (!isOpen) return null;

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const toggleThu = (thu: string) => {
    setForm(prev => {
      const isSelected = prev.cacThu.includes(thu);
      if (isSelected) {
        return { ...prev, cacThu: prev.cacThu.filter(t => t !== thu) };
      } else {
        return { ...prev, cacThu: [...prev.cacThu, thu] };
      }
    });
  };

  // useGoogleLogin kích hoạt popup xin quyền Google Calendar
  const loginWithGoogle = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.events',
    onSuccess: async (tokenResponse) => {
      setIsSyncingGoogle(true);
      try {
        await axiosClient.post('/learning-tools/sync-calendar', {
          accessToken: tokenResponse.access_token,
          tenNhacNho: form.tenNhacNho || 'Nhắc nhở học tập',
          tanSuat: form.tanSuat,
          thoiGian: form.thoiGian,
          cacThu: form.tanSuat === 'HANG_TUAN' ? form.cacThu.join(',') : undefined,
          ngayCuThe: form.tanSuat === 'MOT_LAN' ? form.ngayCuThe : undefined,
          courseId: form.courseId ? Number(form.courseId) : undefined,
        });
        setGoogleSynced(true);
        toast.success('Đã đồng bộ với Google Calendar!');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Không thể đồng bộ Google Calendar');
      } finally {
        setIsSyncingGoogle(false);
      }
    },
    onError: () => {
      toast.error('Không thể đăng nhập Google');
    },
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        tenNhacNho: form.tenNhacNho,
        courseId: form.courseId ? Number(form.courseId) : undefined,
        tanSuat: form.tanSuat,
        thoiGian: form.thoiGian,
        cacThu: form.tanSuat === 'HANG_TUAN' ? form.cacThu.join(',') : undefined,
        ngayCuThe: form.tanSuat === 'MOT_LAN' ? form.ngayCuThe : undefined,
      };

      await axiosClient.post('/learning-tools/reminders', payload);
      toast.success('Đã lưu nhắc nhở học tập!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Nhắc nhở học tập</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-800">
          <p className="text-slate-500 mb-6 font-medium">Bước {step}/3</p>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-sm">Tên</label>
                  <span className="text-xs text-slate-400 font-medium">không bắt buộc</span>
                </div>
                <input
                  type="text"
                  value={form.tenNhacNho}
                  onChange={e => setForm({ ...form, tenNhacNho: e.target.value })}
                  className="w-full border border-slate-300 rounded p-3 text-sm focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-sm">Đính kèm nội dung <span className="font-normal text-slate-500">(không bắt buộc)</span></label>
                </div>
                <p className="text-sm text-slate-600 mb-4">Các khóa học hoặc lab gần đây nhất:</p>
                
                <div className="space-y-3 mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="course" 
                      checked={form.courseId === currentCourseId}
                      onChange={() => setForm({ ...form, courseId: currentCourseId })}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-600 border-slate-300"
                    />
                    <span className="text-sm">Khóa học: {currentCourseName}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="course" 
                      checked={form.courseId === ''}
                      onChange={() => setForm({ ...form, courseId: '' })}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-600 border-slate-300"
                    />
                    <span className="text-sm">Không có</span>
                  </label>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full border border-slate-300 rounded p-3 pl-10 text-sm focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <label className="font-bold text-sm block mb-3">Tần suất</label>
                <div className="flex flex-wrap gap-3">
                  {['HANG_NGAY', 'HANG_TUAN', 'MOT_LAN'].map(type => (
                    <button
                      key={type}
                      onClick={() => setForm({ ...form, tanSuat: type })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-colors ${
                        form.tanSuat === type 
                          ? 'border-purple-200 bg-purple-50 text-purple-700' 
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {form.tanSuat === type && <Check size={16} />}
                      {type === 'HANG_NGAY' ? 'Hàng ngày' : type === 'HANG_TUAN' ? 'Hằng tuần' : 'Một lần'}
                    </button>
                  ))}
                </div>
                {!form.tanSuat && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><X size={14}/> Tần suất là bắt buộc.</p>}
              </div>

              <div>
                <label className="font-bold text-sm block mb-3">Thời gian</label>
                <div className="relative w-40">
                  <input
                    type="time"
                    value={form.thoiGian}
                    onChange={e => setForm({ ...form, thoiGian: e.target.value })}
                    className="w-full border border-slate-300 rounded p-3 text-sm focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none transition"
                  />
                </div>
              </div>

              {form.tanSuat === 'HANG_TUAN' && (
                <div>
                  <label className="font-bold text-sm block mb-3">Ngày</label>
                  <div className="flex flex-wrap gap-2">
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(thu => (
                      <button
                        key={thu}
                        onClick={() => toggleThu(thu)}
                        className={`px-4 py-2 rounded-full border text-sm font-bold transition-colors ${
                          form.cacThu.includes(thu)
                            ? 'border-slate-800 bg-slate-800 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {form.cacThu.includes(thu) ? <Check size={14} className="inline mr-1 -ml-1"/> : '+'} {thu}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.tanSuat === 'MOT_LAN' && (
                <div>
                  <label className="font-bold text-sm block mb-3">Ngày cụ thể</label>
                  <div className="relative w-full">
                    <input
                      type="date"
                      value={form.ngayCuThe}
                      onChange={e => setForm({ ...form, ngayCuThe: e.target.value })}
                      className="w-full border border-slate-300 rounded p-3 text-sm focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none transition"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <label className="font-bold text-sm block mb-4">Thêm vào lịch <span className="font-normal text-slate-500">(không bắt buộc)</span></label>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Nút đồng bộ Google Calendar */}
                  <button
                    onClick={() => loginWithGoogle()}
                    disabled={isSyncingGoogle || googleSynced}
                    className={`inline-flex items-center justify-center gap-2 py-3 px-6 border-2 rounded-lg text-sm font-bold transition-all ${
                      googleSynced
                        ? 'border-green-500 bg-green-50 text-green-700 cursor-default'
                        : 'border-purple-600 text-purple-700 hover:bg-purple-50 disabled:opacity-60'
                    }`}
                    style={googleSynced ? {} : { borderColor: '#5624D0', color: '#5624D0' }}
                  >
                    {googleSynced ? (
                      <>
                        {/* Tick xanh – giống Udemy */}
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
                          <Check size={13} className="text-white" strokeWidth={3} />
                        </span>
                        <span>Google Calendar đã đồng bộ</span>
                      </>
                    ) : isSyncingGoogle ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                        </svg>
                        Đang đồng bộ...
                      </>
                    ) : (
                      <>
                        {/* Google icon */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Đăng nhập bằng Google
                      </>
                    )}
                  </button>
                </div>

                {/* Mô tả nhữ dưới nút */}
                <p className="text-xs text-slate-400 mt-3">
                  Cho phép Edumeo tạo lịch lặp lại trực tiếp trên Google Calendar của bạn
                  với thông báo đổ chuông trước 10 phút.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-b-lg">
          {step > 1 ? (
            <button onClick={handlePrev} className="text-sm font-bold transition-colors hover:opacity-80" style={{ color: '#5624D0' }}>
              Trước
            </button>
          ) : <div></div>}
          
          {step < 3 ? (
            <button onClick={handleNext} className="text-white px-6 py-2.5 rounded text-sm font-bold transition-colors hover:opacity-90" style={{ backgroundColor: '#5624D0' }}>
              Tiếp theo
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="text-white px-6 py-2.5 rounded text-sm font-bold transition-colors disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: '#5624D0' }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Xong'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
