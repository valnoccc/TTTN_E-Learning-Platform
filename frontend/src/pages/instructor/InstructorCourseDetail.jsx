import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InstructorLayout from '../../layouts/InstructorLayout';
import axiosClient from '../../api/axios';
import { FileEdit, UploadCloud, ChevronDown, AlertTriangle, Bold, Italic, List, Link as LinkIcon, Code, GripVertical, Plus } from 'lucide-react';

export default function InstructorCourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNewCourse = id === 'new';

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: 0,
        category: 'Web Development',
        image: '',
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [errorText, setErrorText] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const fetchCourseDetail = async () => {
            if (!isNewCourse) {
                try {
                    const response = await axiosClient.get(`/courses/${id}`);
                    const courseData = response.data.data || response.data;
                    setFormData({
                        title: courseData.ten_khoa_hoc || '',
                        description: courseData.mo_ta || '',
                        price: courseData.gia || 0,
                        category: courseData.id_danh_muc === 1 ? 'Web Development' : 'Data Science',
                        hinh_anh: courseData.hinh_anh || '',
                    });
                    // Nếu có hình ảnh cũ, hiển thị làm preview
                    if (courseData.hinh_anh) {
                        setImagePreview(courseData.hinh_anh);
                    }
                } catch (error) {
                    console.error('Lỗi khi tải thông tin:', error);
                }
            }
        };
        fetchCourseDetail();
    }, [id, isNewCourse]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'title') setErrorText('');
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            setErrorText('Tên khóa học không được để trống!');
            return;
        }

        try {
            // Sử dụng FormData để gửi file
            const data = new FormData();
            data.append('ten_khoa_hoc', formData.title);
            data.append('mo_ta', formData.description);
            data.append('gia', formData.price);
            data.append('id_danh_muc', formData.category === 'Web Development' ? 1 : 2);

            // 'file_anh_that' là File object lấy từ input type="file"
            if (formData.file_anh_that) {
                data.append('image', formData.file_anh_that);
            }

            if (isNewCourse) {
                await axiosClient.post('/courses', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Tạo khóa học mới thành công!');
            } else {
                await axiosClient.put(`/courses/${id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Cập nhật thành công!');
            }
            navigate('/instructor/courses');
        } catch (error) {
            alert('Lỗi khi lưu khóa học! Hãy kiểm tra dữ liệu.');
        }
    };

    const confirmDelete = async () => {
        setIsDeleteModalOpen(false);
        try {
            await axiosClient.delete(`/courses/${id}`);
            alert('Đã xử lý thành công!');
            navigate('/instructor/courses');
        } catch (error) {
            alert('Lỗi: Không thể thực hiện yêu cầu!');
        }
    };

    return (
        <InstructorLayout>
            <div className="p-8 max-w-[1280px] mx-auto w-full">
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h2 className="text-[32px] font-bold text-[#172B4D] dark:text-white leading-[40px] tracking-tight">
                                {isNewCourse ? 'Tạo khóa học mới' : formData.title || 'Đang tải...'}
                            </h2>
                            <p className="text-[16px] text-[#6B778C] dark:text-slate-400 mt-1">Thiết lập chương trình học, giá cả và hiển thị.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/instructor/courses')}
                                className="px-6 py-2 border border-[#DFE1E6] dark:border-slate-700 rounded-lg text-[14px] font-semibold text-[#172B4D] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-800 transition-colors">
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-[#0052CC] text-white rounded-lg text-[14px] font-semibold shadow-lg shadow-[#0052CC]/20 hover:opacity-90 transition-opacity">
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 space-y-6">
                        <section className="bg-white dark:bg-[#1E2329] border border-[#DFE1E6] dark:border-slate-800 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#F4F5F7] dark:border-slate-800">
                                <FileEdit className="text-[#0052CC]" size={20} />
                                <h3 className="text-[20px] font-semibold text-[#172B4D] dark:text-white">Thông tin cơ bản</h3>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[14px] font-semibold text-[#172B4D] dark:text-slate-300 mb-2">Tên khóa học <span className="text-red-500">*</span></label>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-white dark:bg-[#14181D] border ${errorText ? 'border-red-500' : 'border-[#DFE1E6] dark:border-slate-700'} rounded-lg focus:ring-2 focus:ring-[#0052CC] outline-none text-[#172B4D] dark:text-white text-[16px]`}
                                        type="text"
                                        placeholder="Nhập tên khóa học"
                                    />
                                    {errorText && <p className="text-red-500 text-sm mt-1">{errorText}</p>}
                                </div>

                                <div>
                                    <label className="block text-[14px] font-semibold text-[#172B4D] dark:text-slate-300 mb-2">Mô tả khóa học</label>
                                    <div className="border border-[#DFE1E6] dark:border-slate-700 rounded-lg overflow-hidden">
                                        <div className="bg-[#F4F5F7] dark:bg-[#1A1D21] px-4 py-2 flex gap-4 border-b border-[#DFE1E6] dark:border-slate-700">
                                            <button className="text-[#6B778C] hover:text-[#0052CC]"><Bold size={16} /></button>
                                            <button className="text-[#6B778C] hover:text-[#0052CC]"><Italic size={16} /></button>
                                            <button className="text-[#6B778C] hover:text-[#0052CC]"><List size={16} /></button>
                                            <button className="text-[#6B778C] hover:text-[#0052CC]"><LinkIcon size={16} /></button>
                                            <button className="text-[#6B778C] hover:text-[#0052CC]"><Code size={16} /></button>
                                        </div>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white dark:bg-[#14181D] border-none focus:ring-0 text-[#172B4D] dark:text-slate-300 text-[14px] leading-relaxed outline-none"
                                            rows="8"
                                            placeholder="Viết mô tả chi tiết cho khóa học của bạn..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {!isNewCourse && (
                            <section className="bg-white dark:bg-[#1E2329] border border-[#DFE1E6] dark:border-slate-800 rounded-xl p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#F4F5F7] dark:border-slate-800">
                                    <h3 className="text-[20px] font-semibold text-[#172B4D] dark:text-white">Chương trình học</h3>
                                    <button className="text-[#0052CC] text-[14px] font-semibold flex items-center gap-1 hover:underline">
                                        <Plus size={16} /> Thêm chương mới
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 p-4 border border-[#DFE1E6] dark:border-slate-700 rounded-lg bg-white dark:bg-[#14181D] hover:bg-[#F0F5FF] dark:hover:bg-slate-800 transition-colors group cursor-move">
                                        <GripVertical className="text-[#6B778C] dark:text-slate-500" size={20} />
                                        <span className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold text-slate-500">01</span>
                                        <div className="flex-1">
                                            <p className="text-[14px] font-semibold text-[#172B4D] dark:text-slate-200">Introduction to Advanced Patterns</p>
                                            <p className="text-[10px] text-[#6B778C] mt-0.5">4 Videos • 2 Quizzes</p>
                                        </div>
                                        <FileEdit className="text-[#6B778C] opacity-0 group-hover:opacity-100" size={18} />
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="md:col-span-4 space-y-6">
                        <section className="bg-white dark:bg-[#1E2329] border border-[#DFE1E6] dark:border-slate-800 rounded-xl p-6 shadow-sm">
                            <label className="block text-[14px] font-semibold text-[#172B4D] dark:text-slate-300 mb-4">
                                Hình ảnh khóa học
                            </label>

                            <div
                                onClick={() => document.getElementById('fileInput').click()}
                                className="relative group aspect-video bg-[#F4F5F7] dark:bg-[#14181D] rounded-lg border-2 border-dashed border-[#DFE1E6] dark:border-slate-700 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-[#0052CC] transition-colors"
                            >
                                {(imagePreview || formData.hinh_anh) ? (
                                    <img
                                        src={imagePreview || formData.hinh_anh}
                                        alt="Preview"
                                        className="absolute inset-0 w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="relative z-10 flex flex-col items-center text-center p-4">
                                        <UploadCloud className="text-[#0052CC] mb-2" size={32} />
                                        <p className="text-[12px] font-semibold text-[#172B4D] dark:text-slate-300">Nhấn để tải ảnh lên</p>
                                        <p className="text-[10px] text-[#6B778C] mt-1">PNG, JPG (Tối đa 5MB)</p>
                                    </div>
                                )}

                                {(imagePreview || formData.hinh_anh) && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-sm font-semibold">Thay đổi hình ảnh</p>
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                id="fileInput"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setImagePreview(reader.result);
                                        reader.readAsDataURL(file);
                                        setFormData({ ...formData, file_anh_that: file });
                                    }
                                }}
                            />
                        </section>

                        <section className="bg-white dark:bg-[#1E2329] border border-[#DFE1E6] dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
                            <div>
                                <label className="block text-[14px] font-semibold text-[#172B4D] dark:text-slate-300 mb-2">Giá khóa học</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#0052CC]">VNĐ</span>
                                    <input
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full pl-16 pr-4 py-3 bg-white dark:bg-[#14181D] border border-[#DFE1E6] dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0052CC] outline-none text-[#172B4D] dark:text-white text-[14px] font-semibold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[14px] font-semibold text-[#172B4D] dark:text-slate-300 mb-2">Danh mục</label>
                                <div className="relative">
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#14181D] border border-[#DFE1E6] dark:border-slate-700 rounded-lg appearance-none focus:ring-2 focus:ring-[#0052CC] outline-none text-[#172B4D] dark:text-white text-[14px]"
                                    >
                                        <option>Web Development</option>
                                        <option>Data Science</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B778C]" size={16} />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/50 dark:bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertTriangle size={28} />
                            <h3 className="text-xl font-bold">Cảnh báo xóa khóa học</h3>
                        </div>
                        <p className="text-[#434654] dark:text-slate-300 mb-6">
                            Bạn có chắc chắn muốn xóa khóa học này không? <br /><br />
                            <span className="font-semibold text-[#172B4D] dark:text-white">Lưu ý:</span> Nếu khóa học này <b>đã có người mua</b>, hệ thống sẽ tự động chuyển sang trạng thái <b>ẨN</b> thay vì xóa hoàn toàn để bảo vệ dữ liệu.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-5 py-2 font-semibold text-[#6B778C] hover:bg-slate-100 rounded-lg transition-colors">
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg transition-colors">
                                Tiếp tục xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </InstructorLayout>
    );
}