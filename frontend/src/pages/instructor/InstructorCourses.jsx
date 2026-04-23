import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '../../layouts/InstructorLayout';
import CourseCard from '../../components/ui/CourseCard';
import axiosClient from '../../api/axios';
import toast from 'react-hot-toast';
import { BookOpen, PlusCircle, Eye, EyeOff, Trash2 } from 'lucide-react'; // Thêm 3 icon mới từ hệ thống lucide

export default function InstructorCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            const response = await axiosClient.get('/courses/my-courses');
            console.log("Dữ liệu API trả về:", response); // In ra để xem cấu trúc thật sự

            // Trích xuất dữ liệu an toàn
            let courseList = [];
            if (response && response.data && Array.isArray(response.data.data)) {
                courseList = response.data.data;
            } else if (response && Array.isArray(response.data)) {
                courseList = response.data; // Phòng trường hợp axiosClient tự động bóc tách data
            } else if (Array.isArray(response)) {
                courseList = response;
            }

            // Đảm bảo luôn set một mảng
            setCourses(courseList);

        } catch (error) {
            toast.error('Không thể tải danh sách khóa học!');
            console.error(error);
            setCourses([]); // Nếu API lỗi, gán mảng rỗng để không bị sập UI
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await axiosClient.delete(`/courses/${id}`);

            // Nếu Backend trả về thông báo đã ẩn (vì có người mua)
            if (response.data.message.includes('ẨN')) {
                toast.success('Khóa học đã có người mua nên hệ thống đã thực hiện ẨN.');
                // Cập nhật lại state để giao diện đổi icon sang "Đã ẩn"
                setCourses(prev => prev.map(c => c.id === id ? { ...c, trang_thai: 'HIDDEN' } : c));
            } else {
                toast.success('Đã xóa thành công!');
                setCourses(prev => prev.filter(c => c.id !== id));
            }
        } catch (error) {
            toast.error('Lỗi khi thực hiện yêu cầu!');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'AN' ? 'CON_KHAI' : 'AN';
        try {
            // Giả sử API của bạn hỗ trợ cập nhật trạng thái
            await axiosClient.patch(`/courses/${id}/status`, { trang_thai: newStatus });
            toast.success(newStatus === 'AN' ? 'Đã ẩn khóa học' : 'Đã hiện khóa học');
            setCourses(courses.map(c => c.id === id ? { ...c, trang_thai: newStatus } : c));
        } catch (error) {
            toast.error('Lỗi khi thay đổi trạng thái!');
        }
    };


    return (
        <InstructorLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Khóa học của tôi.</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Quản lý nội dung giảng dạy và tiến độ học viên.</p>
                </div>
                <Link to="/instructor/courses/new"
                    className="flex items-center gap-2 bg-[#0071E3] text-white px-4 py-2 rounded-md text-[13px] font-medium hover:bg-[#0077ED] transition-colors shadow-sm whitespace-nowrap">
                    <PlusCircle size={16} /> Tạo khóa học mới
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Skeleton Loading */}
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="bg-white border border-gray-200 rounded-md p-4 animate-pulse">
                            <div className="w-full h-36 bg-gray-100 rounded-md mb-4"></div>
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : courses?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all">

                            {/* Click vào phần nội dung để xem chi tiết */}
                            <Link to={`/instructor/courses/${course.id}`}>
                                <CourseCard
                                    title={course.ten_khoa_hoc}
                                    instructor="Bạn"
                                    price={course.gia > 0 ? `${Number(course.gia).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                                    image={course.hinh_anh}
                                />
                            </Link>

                            {/* NHÓM NÚT ĐIỀU KHIỂN (Hiện khi hover) */}
                            {/* NHÓM NÚT ĐIỀU KHIỂN (Hiện khi hover) */}
                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">

                                {/* Nút Ẩn/Hiện dùng icon Eye/EyeOff của hệ thống Lucide */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleToggleStatus(course.id, course.trang_thai);
                                    }}
                                    className="p-2 bg-white shadow-md rounded-full text-gray-600 hover:text-blue-600 transition-all"
                                >
                                    {course.trang_thai === 'AN' ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>

                                {/* Nút Xóa dùng icon Trash2 của hệ thống Lucide */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDelete(course.id);
                                    }}
                                    className="p-2 bg-white shadow-md rounded-full text-gray-600 hover:text-red-600 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Nhãn trạng thái nếu khóa học đang ẩn */}
                            {course.trang_thai === 'AN' && (
                                <div className="absolute top-3 left-3 bg-red-500/90 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase shadow-sm">
                                    Đang ẩn
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                /* Trạng thái trống (Empty State) */
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <BookOpen size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1D1D1F] mb-2">Chưa có khóa học nào</h3>
                    <p className="text-gray-500 text-[13px] font-medium max-w-sm mb-6">Bạn chưa tạo khóa học nào trên hệ thống. Hãy bắt đầu chia sẻ kiến thức ngay.</p>
                    <Link
                        to="/instructor/courses/new"
                        className="bg-white border border-gray-300 text-[#1D1D1F] px-4 py-2 rounded-md text-[13px] font-medium hover:bg-gray-50 transition-colors"
                    >
                        Khởi tạo ngay
                    </Link>
                </div>
            )}
        </InstructorLayout>
    );
}