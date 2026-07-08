import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import LearningReminderModal from './LearningReminderModal';
import axiosClient from '../../../../../api/axios';
import { toast } from 'react-hot-toast';

export default function CourseLearningTools({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const response: any = await axiosClient.get('/learning-tools/reminders');
      setReminders(response.data?.data || []);
    } catch (error) {
      console.error('Lỗi khi tải nhắc nhở:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhắc nhở này?')) return;
    try {
      await axiosClient.delete(`/learning-tools/reminders/${id}`);
      toast.success('Đã xóa nhắc nhở');
      fetchReminders();
    } catch (error) {
      toast.error('Không thể xóa nhắc nhở');
    }
  };

  return (
    <div className="max-w-4xl py-8 px-4 sm:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Nhắc nhở học tập</h2>
        <p className="text-slate-600 mb-6">Thiết lập thông báo đẩy hoặc sự kiện lịch để theo dõi mục tiêu học tập của bạn.</p>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#5624D0' }}
        >
          <Plus size={16} />
          Thêm nhắc nhở học tập
        </button>
      </div>

      {!loading && reminders.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Nhắc nhở của bạn</h3>
          {reminders.map((reminder) => (
            <div key={reminder.maNN} className="border rounded-lg p-4 bg-white shadow-sm flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800">{reminder.tenNhacNho}</h4>
                <p className="text-sm text-slate-600">
                  {reminder.tanSuat === 'HANG_NGAY' && `Hàng ngày lúc ${reminder.thoiGian.substring(0, 5)}`}
                  {reminder.tanSuat === 'HANG_TUAN' && `Hàng tuần vào ${reminder.cacThu} lúc ${reminder.thoiGian.substring(0, 5)}`}
                  {reminder.tanSuat === 'MOT_LAN' && `Một lần vào ${new Date(reminder.ngayCuThe).toLocaleDateString('vi-VN')} lúc ${reminder.thoiGian.substring(0, 5)}`}
                </p>
              </div>
              <button onClick={() => handleDelete(reminder.maNN)} className="text-red-500 hover:text-red-700 text-sm font-medium">Xóa</button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <LearningReminderModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchReminders();
          }}
          currentCourseId={courseId}
          currentCourseName={courseName}
        />
      )}
    </div>
  );
}
