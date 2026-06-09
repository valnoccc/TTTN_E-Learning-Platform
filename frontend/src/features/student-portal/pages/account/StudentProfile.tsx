import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, User, BookOpen, CreditCard, Save, Camera, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import axiosClient from '../../../../api/axios';

type StoredUser = {
  id?: number | string;
  maND?: number | string;
  fullName?: string;
  name?: string;
  hoTen?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
  avatar?: string;
};

export default function StudentProfile() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'courses' | 'payments' | 'password'>('profile');
  const [user, setUser] = useState<StoredUser | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', avatarUrl: '' });
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const parsedUser = JSON.parse(userString);
        setUser(parsedUser);
        setFormData({
          name: parsedUser.fullName || parsedUser.name || '',
          email: parsedUser.email || '',
          phone: parsedUser.phone || '',
          avatarUrl: parsedUser.avatarUrl || parsedUser.avatar || parsedUser.photoUrl || parsedUser.imageUrl || ''
        });
      } catch (e) {
        console.error('Lỗi khi parse user', e);
      }
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id && !user?.maND) {
      toast.error('Không tìm thấy ID người dùng!');
      return;
    }

    setIsLoading(true);

    try {
      const userId = user.id || user.maND;
      
      const payload: any = { name: formData.name };
      if (formData.avatarUrl && !formData.avatarUrl.startsWith('blob:')) {
        payload.avatarUrl = formData.avatarUrl;
      }

      // Gửi yêu cầu cập nhật lên backend
      await axiosClient.patch(`/users/${userId}`, payload);

      const updatedUser = {
        ...user,
        name: formData.name,
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('auth-change'));
      
      setUser(updatedUser);
      toast.success(t('Update Profile') + ' ' + t('Success'));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi cập nhật hồ sơ';
      toast.error(`Lỗi: ${errorMessage}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Hiển thị preview cục bộ
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatarUrl: previewUrl }));
      
      try {
        toast.loading('Đang xử lý ảnh đại diện...', { id: 'upload-avatar' });
        const uploadData = new FormData();
        uploadData.append('file', file);
        
        const res: any = await axiosClient.post('/cloudinary/upload', uploadData);
        if (res?.url) {
          setFormData(prev => ({ ...prev, avatarUrl: res.url }));
          
          if (user?.id || user?.maND) {
            const userId = user.id || user.maND;
            await axiosClient.patch(`/users/${userId}`, { avatarUrl: res.url });
            
            const updatedUser = { ...user, avatarUrl: res.url, avatar: res.url };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            window.dispatchEvent(new Event('auth-change'));
          }

          toast.success('Tải ảnh thành công!', { id: 'upload-avatar' });
        }
      } catch (err: any) {
        const originalAvatar = user?.avatarUrl || user?.avatar || '';
        setFormData(prev => ({ 
          ...prev, 
          avatarUrl: originalAvatar.startsWith('blob:') ? '' : originalAvatar 
        }));
        
        const msg = err.response?.data?.message || err.message || 'Lỗi tải ảnh';
        toast.error(`Lỗi: ${msg}`, { id: 'upload-avatar' });
        console.error('Chi tiết lỗi upload:', err.response?.data || err);
      }
    }
  };

  // Mock Data
  const myCourses = [
    { id: 1, title: 'ReactJS Masterclass', progress: 80, image: '/assets/images/course-1.jpg' },
    { id: 2, title: 'Advanced Tailwind CSS', progress: 45, image: '/assets/images/course-2.jpg' },
  ];

  const paymentHistory = [
    { id: 'INV-001', date: '2026-06-01', amount: 49.0, status: 'Success' },
    { id: 'INV-002', date: '2026-06-05', amount: 99.0, status: 'Pending' },
  ];

  return (
    <div className="profile-page bg-slate-50 min-h-screen pb-16">
      <BreadcrumbBox title={t('Student Profile')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sticky top-24">
              <div className="flex items-center gap-4 p-4 mb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl overflow-hidden">
                  {user?.avatarUrl || user?.avatar ? (
                    <img src={user.avatarUrl || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (user?.fullName || user?.name || user?.hoTen || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{user?.fullName || user?.name || user?.hoTen || 'User'}</h4>
                  <p className="text-sm text-slate-500">Học viên</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'profile' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User size={20} />
                  {t('Personal Info')}
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'courses' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen size={20} />
                  {t('My Courses')}
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'payments' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard size={20} />
                  {t('Payment History')}
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'password' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Lock size={20} />
                  Đổi mật khẩu
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">{t('Personal Info')}</h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6 mb-8">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-white shadow-md flex items-center justify-center font-bold text-3xl overflow-hidden text-emerald-600">
                          {formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            user?.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-600 cursor-pointer hover:text-emerald-600 hover:border-emerald-200 transition-colors">
                          <Camera size={16} />
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </label>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Ảnh đại diện</h4>
                        <p className="text-sm text-slate-500">Định dạng JPG, PNG. Nhấp vào icon Camera để thay đổi.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('Name')}</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('Email')}</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          disabled
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('Phone')}</label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-70"
                      >
                        {isLoading ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                          <Save size={20} />
                        )}
                        {t('Update Profile')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* My Courses Tab */}
              {activeTab === 'courses' && (
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">{t('My Courses')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myCourses.map((course) => (
                      <div key={course.id} className="border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-shadow group">
                        <div className="h-40 bg-slate-200 rounded-xl mb-4 overflow-hidden">
                           <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-400">
                             <BookOpen size={40} />
                           </div>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2">{course.title}</h4>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-500">Tiến độ</span>
                            <span className="font-semibold text-emerald-600">{course.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${course.progress}%` }}></div>
                          </div>
                        </div>
                        <button className="w-full py-2.5 bg-slate-50 text-slate-700 font-medium rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                          {t('Learn Now')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment History Tab */}
              {activeTab === 'payments' && (
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">{t('Payment History')}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                          <th className="p-4 font-semibold">{t('Date')}</th>
                          <th className="p-4 font-semibold">{t('Invoice ID')}</th>
                          <th className="p-4 font-semibold">{t('Amount')}</th>
                          <th className="p-4 font-semibold text-right">{t('Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentHistory.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-slate-600">{invoice.date}</td>
                            <td className="p-4 font-medium text-slate-800">{invoice.id}</td>
                            <td className="p-4 font-semibold text-slate-700">${invoice.amount.toFixed(2)}</td>
                            <td className="p-4 text-right">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                invoice.status === 'Success' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {invoice.status === 'Success' ? t('Success') : t('Pending')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">Đổi mật khẩu</h3>
                  <p className="text-slate-600 mb-6">Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.</p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (passwordData.newPassword.length < 6) {
                      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
                      return;
                    }
                    if (passwordData.newPassword !== passwordData.confirmPassword) {
                      toast.error('Mật khẩu xác nhận không khớp!');
                      return;
                    }
                    if (!user?.id && !user?.maND) {
                      toast.error('Lỗi: Không tìm thấy ID người dùng!');
                      return;
                    }

                    setIsPasswordLoading(true);
                    try {
                      const userId = user.id || user.maND;
                      const res: any = await axiosClient.post('/auth/change-password', {
                        userId,
                        oldPassword: passwordData.oldPassword,
                        newPassword: passwordData.newPassword
                      });
                      toast.success(res?.message || 'Đổi mật khẩu thành công!');
                      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    } catch (error: any) {
                      const msg = error.response?.data?.message || 'Lỗi khi đổi mật khẩu';
                      toast.error(`Lỗi: ${msg}`);
                    } finally {
                      setIsPasswordLoading(false);
                    }
                  }} className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isPasswordLoading}
                      className="flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto bg-emerald-600 text-white font-medium rounded-xl shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-70"
                    >
                      {isPasswordLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <Lock size={20} />
                      )}
                      Cập nhật mật khẩu
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
