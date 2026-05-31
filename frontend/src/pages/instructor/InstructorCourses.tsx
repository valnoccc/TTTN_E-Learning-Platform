import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '../../layouts/InstructorLayout';
import CourseCard from '../../components/ui/CourseCard';
import axiosClient from '../../api/axios';
import toast from 'react-hot-toast';
import { BookOpen, PlusCircle, Eye, EyeOff, Trash2 } from 'lucide-react';

interface Course {
    id: string | number;
    ten_khoa_hoc: string;
    gia: number;
    hinh_anh: string;
    trang_thai: string;
}

export default function InstructorCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            const response: any = await axiosClient.get('/courses/my-courses');
            let courseList = [];
            if (response?.data?.data && Array.isArray(response.data.data)) {
                courseList = response.data.data;
            } else if (Array.isArray(response?.data)) {
                courseList = response.data;
            }
            setCourses(courseList);
        } catch (error) {
            toast.error('Không thể tải danh sách khóa học!');
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string | number) => {
        try {
            const response: any = await axiosClient.delete(`/courses/${id}`);
            if (response.data?.message?.includes('ẨN')) {
                toast.success('Khóa học đã có người mua nên hệ thống đã chuyển sang ẨN.');
                setCourses(prev => prev.map(c => c.id === id ? { ...c, trang_thai: 'HIDDEN' } : c));
            } else {
                toast.success('Đã xóa thành công!');
                setCourses(prev => prev.filter(c => c.id !== id));
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Lỗi hệ thống khi xóa khóa học!';
            toast.error(`Thất bại: ${errorMessage}`);
        }
    };

    const handleToggleStatus = async (id: string | number, currentStatus: string) => {
        const newStatus = currentStatus === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN';
        try {
            await axiosClient.patch(`/courses/${id}/status`, { trang_thai: newStatus });
            toast.success(newStatus === 'HIDDEN' ? 'Đã ẩn khóa học' : 'Đã công khai khóa học');
            setCourses(prev => prev.map(c => c.id === id ? { ...c, trang_thai: newStatus } : c));
        } catch (error) {
            toast.error('Lỗi khi thay đổi trạng thái!');
        }
    };

    return (
        <InstructorLayout>
            <div className="relative space-y-8 overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(0,113,227,0.12),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(29,29,31,0.06),_transparent_30%),linear-gradient(to_bottom,_rgba(255,255,255,0.95),_transparent)]" />

                <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                    <div className="absolute inset-y-0 right-0 hidden w-72 bg-[radial-gradient(circle,_rgba(0,113,227,0.12),_transparent_70%)] lg:block" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                                <BookOpen size={12} className="text-[#0071E3]" />
                                Khóa học của tôi
                            </div>
                            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#1D1D1F] sm:text-4xl">
                                Quản lý khóa học
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                                Theo dõi nội dung giảng dạy, kiểm soát trạng thái hiển thị và truy cập nhanh vào từng khóa học.
                            </p>
                        </div>

                        <Link
                            to="/instructor/courses/new"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0071E3] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_30px_rgba(0,113,227,0.22)] transition hover:bg-[#0077ED]"
                        >
                            <PlusCircle size={16} />
                            Tạo khóa học mới
                        </Link>
                    </div>
                </section>

                {loading ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3, 4].map((n) => (
                            <div
                                key={n}
                                className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl"
                            >
                                <div className="aspect-[16/10] animate-pulse bg-slate-200/70" />
                                <div className="space-y-3 p-5">
                                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200/80" />
                                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200/70" />
                                    <div className="flex items-center gap-2 pt-2">
                                        <div className="h-8 w-20 animate-pulse rounded-full bg-slate-200/70" />
                                        <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200/70" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : courses?.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
                            >
                                <Link to={`/instructor/courses/${course.id}`} className="block">
                                    <div className="relative">
                                        <CourseCard
                                            title={course.ten_khoa_hoc}
                                            instructor="Bạn"
                                            price={course.gia > 0 ? `${Number(course.gia).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                                            image={course.hinh_anh}
                                        />
                                    </div>
                                </Link>

                                <div className="absolute right-4 top-4 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleToggleStatus(course.id, course.trang_thai);
                                        }}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/95 text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition hover:text-[#0071E3]"
                                    >
                                        {course.trang_thai === 'HIDDEN' ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete(course.id);
                                        }}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/95 text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition hover:text-red-600"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                {course.trang_thai === 'HIDDEN' && (
                                    <div className="absolute left-4 top-4 rounded-full border border-red-200 bg-red-500/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                                        Đang ẩn
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-white/70 bg-white/90 px-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                            <BookOpen size={24} />
                        </div>
                        <h3 className="mt-5 text-lg font-semibold text-[#1D1D1F]">Chưa có khóa học nào</h3>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                            Bạn chưa tạo khóa học nào trên hệ thống. Hãy bắt đầu chia sẻ kiến thức ngay.
                        </p>
                        <Link
                            to="/instructor/courses/new"
                            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#1D1D1F] shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            Khởi tạo ngay
                        </Link>
                    </div>
                )}
            </div>
        </InstructorLayout>
    );
}
