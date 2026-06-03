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

    // ... (Giữ nguyên các logic handleDelete và handleToggleStatus) ...

    return (
        <InstructorLayout>
            <div className="space-y-6">
                {/* Đã xóa radial-gradient rườm rà ở phía sau */}
                <section className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
                            <BookOpen size={16} />
                            <span>Khóa học của tôi</span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold text-slate-800">
                            Quản lý khóa học
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Theo dõi nội dung giảng dạy, kiểm soát trạng thái hiển thị và truy cập nhanh vào từng khóa học.
                        </p>
                    </div>

                    <Link
                        to="/instructor/courses/new"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                        <PlusCircle size={18} />
                        Tạo khóa học mới
                    </Link>
                </section>

                {loading ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                <div className="aspect-[16/10] animate-pulse bg-slate-200" />
                                <div className="space-y-3 p-5">
                                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                                    <div className="pt-2 flex items-center gap-2">
                                        <div className="h-8 w-20 animate-pulse rounded bg-slate-200" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : courses?.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                            >
                                <Link to={`/instructor/courses/${course.id}`} className="block">
                                    <CourseCard
                                        title={course.ten_khoa_hoc}
                                        instructor="Bạn"
                                        price={course.gia > 0 ? `${Number(course.gia).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                                        image={course.hinh_anh}
                                    />
                                </Link>

                                <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // handleToggleStatus(course.id, course.trang_thai);
                                        }}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-600"
                                    >
                                        {course.trang_thai === 'HIDDEN' ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // handleDelete(course.id);
                                        }}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-red-200 hover:text-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {course.trang_thai === 'HIDDEN' && (
                                    <div className="absolute left-3 top-3 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                                        Đang ẩn
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-center shadow-sm">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                            <BookOpen size={28} />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-800">Chưa có khóa học nào</h3>
                        <p className="mt-2 text-sm text-slate-500">Bạn chưa tạo khóa học nào trên hệ thống. Hãy bắt đầu ngay.</p>
                        <Link
                            to="/instructor/courses/new"
                            className="mt-5 inline-flex items-center justify-center rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            Khởi tạo ngay
                        </Link>
                    </div>
                )}
            </div>
        </InstructorLayout>
    );
}