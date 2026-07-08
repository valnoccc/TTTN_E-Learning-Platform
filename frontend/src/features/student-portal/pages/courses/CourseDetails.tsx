import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import ReviewForm from './components/ReviewForm';
import PopularCourse from './components/PopularCourse';
import CourseTag from './components/CourseTag';
import { Styles } from './styles/course';

import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../../cart/cartSlice';
import { toggleWishlist } from '../../../wishlist/wishlistSlice';
import { RootState } from '../../../../store/store';
import axiosClient from '../../../../api/axios';
import toast from 'react-hot-toast';
import { Star, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function getTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ngày trước`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} năm trước`;
}

function useDarkMode() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDark = () => document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
        setIsDark(checkDark());

        const observer = new MutationObserver(() => {
            setIsDark(checkDark());
        });
        
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    return isDark;
}

function CourseDetails() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
    
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
    const [curriculum, setCurriculum] = useState<any[]>([]);
    const [expandedChapters, setExpandedChapters] = useState<number[]>([]);
    const [previewVideo, setPreviewVideo] = useState<string | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [repliesData, setRepliesData] = useState<any[]>([]);
    const [allParentReviews, setAllParentReviews] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const reviewsSectionRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        if (reviewsSectionRef.current) {
            reviewsSectionRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    };
    const isDarkMode = useDarkMode();
    
    let userRole = '';
    let isLoggedIn = false;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            isLoggedIn = true;
            const u = JSON.parse(userStr);
            userRole = (u.role || u.vaiTro || '').toUpperCase();
        }
    } catch(e) {}
    const isInstructorOrAdmin = userRole === 'INSTRUCTOR' || userRole === 'ADMIN';

    const [reviewStats, setReviewStats] = useState({ avgRating: 0, totalReviews: 0, bars: [
        { stars: 5, pct: '0%' },
        { stars: 4, pct: '0%' },
        { stars: 3, pct: '0%' },
        { stars: 2, pct: '0%' },
        { stars: 1, pct: '0%' }
    ] });
    const [reviewForm, setReviewForm] = useState({ soSao: 5, noiDung: '' });

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                const response: any = await axiosClient.get(`/public/courses/${id}`);
                if (response && response.data) {
                    let parsedKetQua = [];
                    let parsedYeuCau = [];
                    try { if (response.data.ketQuaHocTap) parsedKetQua = JSON.parse(response.data.ketQuaHocTap); } catch(e){}
                    try { if (response.data.yeuCauKhoaHoc) parsedYeuCau = JSON.parse(response.data.yeuCauKhoaHoc); } catch(e){}

                    const isEnglishDummyKetQua = parsedKetQua.some((str: string) => str.includes('Handle advanced') || str.includes('Machine Learning'));
                    if (isEnglishDummyKetQua || parsedKetQua.length === 0) {
                        parsedKetQua = [
                            'Nắm vững các kiến thức nền tảng và chuyên sâu của khóa học',
                            'Thành thạo các công cụ và kỹ năng thông qua bài tập thực tế',
                            'Có khả năng giải quyết các tình huống và dự án độc lập',
                            'Nâng cao tư duy logic và quy trình làm việc hiệu quả'
                        ];
                    }

                    const isEnglishDummyYeuCau = parsedYeuCau.some((str: string) => str.toLowerCase().includes('python') || str.toLowerCase().includes('experience'));
                    if (isEnglishDummyYeuCau || parsedYeuCau.length === 0) {
                        parsedYeuCau = [
                            'Máy tính có kết nối internet ổn định',
                            'Tinh thần tự học và sẵn sàng hoàn thành các bài tập thực hành',
                            'Không yêu cầu kinh nghiệm trước đó'
                        ];
                    }

                    const updatedSource = response.data.ngayCapNhat ?? response.data.updatedAt;
                    const formattedUpdatedAt = updatedSource
                        ? new Date(updatedSource).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        })
                        : 'Đang cập nhật';

                    setIsEnrolled(!!response.data.isEnrolled);

                    setCourse({
                        id: parseInt(response.data.maKH),
                        courseName: response.data.tenKhoaHoc,
                        thumbnail: response.data.hinhThuNho ? (response.data.hinhThuNho.startsWith('http') ? response.data.hinhThuNho : '/assets/images/' + response.data.hinhThuNho) : '/assets/images/course-1.jpg',
                        instructor: response.data.giangVien ? (response.data.giangVien.tenGiangVien || response.data.giangVien.hoTen || 'Unknown Instructor') : 'Unknown Instructor',
                        price: parseFloat(response.data.giaBan || '0'),
                        duration: '120 Min',
                        level: 'All Levels',
                        category: response.data.danhMuc?.tenDM || 'General',
                        moTa: response.data.moTa,
                        danhMuc: response.data.danhMuc,
                        giangVien: response.data.giangVien,
                        ketQuaHocTap: parsedKetQua,
                        yeuCauKhoaHoc: parsedYeuCau,
                        baiHocs: response.data.baiHocs?.sort((a: any, b: any) => a.thuTu - b.thuTu) || [],
                        totalStudents: response.data.totalStudents || 0,
                        updatedAt: formattedUpdatedAt,
                    });
                }
            } catch (error) {
                console.error("Error fetching course details", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCourseDetails();
        }
    }, [id]);

    const [isOwned, setIsOwned] = useState<boolean>(false);

    useEffect(() => {
        const fetchUserCourses = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    const userId = u.id || u.maND || u.sub;
                    if (userId) {
                        const res: any = await axiosClient.get(`/users/${userId}/courses`);
                        const courses = res?.data ?? res ?? [];
                        console.log('[CourseDetails] User courses:', courses);
                        const owned = courses.some((c: any) => Number(c.MaKH || c.maKH || c.id) === Number(id));
                        setIsOwned(owned);
                        // Đồng bộ: nếu đã sở hữu thì cũng đặt isEnrolled = true
                        // để tránh hiện nút 'Đăng ký ngay' ảo
                        if (owned) {
                            setIsEnrolled(true);
                        }
                    }
                } catch (error) {
                    console.error('[CourseDetails] Error fetching user courses', error);
                }
            }
        };
        fetchUserCourses();
    }, [id]);

    useEffect(() => {
        const fetchCurriculum = async () => {
            if (!id) return;
            try {
                const response: any = await axiosClient.get(`/public/courses/${id}/curriculum`);
                if (response && response.data) {
                    setCurriculum(response.data);
                    if (response.data.length > 0) {
                        setExpandedChapters([response.data[0].maChuong]);
                    }
                }
            } catch (error) {
                console.error("Error fetching curriculum", error);
            }
        };
        fetchCurriculum();
    }, [id]);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!id) return;
            try {
                const response: any = await axiosClient.get(`/public/courses/${id}/reviews`);
                if (response && response.data) {
                    const fetchedData = response.data;
                    
                    // Backend already returns a nested tree structure (root reviews with .replies array)
                    const parents = fetchedData;
                    
                    setAllParentReviews(parents);
                    setReviews(parents); // Initial display
                    
                    // If you still need a flat replies array for something else, you can extract it:
                    const replies: any[] = [];
                    parents.forEach((p: any) => {
                        if (p.replies && p.replies.length > 0) {
                            replies.push(...p.replies);
                        }
                    });
                    setRepliesData(replies);
                    
                    let totalRating = 0;
                    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    
                    parents.forEach((r: any) => {
                        totalRating += r.rating;
                        if (r.rating >= 1 && r.rating <= 5) {
                            ratingCounts[r.rating as keyof typeof ratingCounts]++;
                        }
                    });
                    
                    const totalReviews = parents.length;
                    const avgRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;
                    
                    const bars = [5, 4, 3, 2, 1].map(stars => ({
                        stars,
                        pct: totalReviews > 0 ? Math.round((ratingCounts[stars as keyof typeof ratingCounts] / totalReviews) * 100) + '%' : '0%'
                    }));
                    
                    setReviewStats({ avgRating: Number(avgRating), totalReviews, bars });
                }
            } catch (error) {
                console.error("Error fetching reviews", error);
            }
        };
        fetchReviews();
    }, [id]);

    useEffect(() => {
        let filtered = allParentReviews;
        if (activeFilter === '5') filtered = allParentReviews.filter(r => r.rating === 5);
        else if (activeFilter === '4') filtered = allParentReviews.filter(r => r.rating === 4);
        else if (activeFilter === 'has_comment') filtered = allParentReviews.filter(r => r.content && r.content.trim().length > 0);
        else if (activeFilter === 'latest') filtered = [...allParentReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(filtered);
        setCurrentPage(1);
    }, [activeFilter, allParentReviews]);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = localStorage.getItem('user');
        if (!user) {
            toast.error('Vui lòng đăng nhập để viết đánh giá');
            navigate('/login', { state: { from: `/course-details/${id}` } });
            return;
        }
        
        if (!reviewForm.noiDung.trim()) {
            toast.error('Vui lòng nhập nội dung đánh giá');
            return;
        }

        try {
            await axiosClient.post(`/courses/${id}/reviews/student`, {
                soSao: reviewForm.soSao,
                noiDung: reviewForm.noiDung
            });
            toast.success('Đã gửi đánh giá thành công!');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Lỗi: ${JSON.stringify(error.response?.data || error.message)}`);
        }
    };


    const toggleChapter = (maChuong: number) => {
        setExpandedChapters(prev => 
            prev.includes(maChuong) ? prev.filter(cId => cId !== maChuong) : [...prev, maChuong]
        );
    };

    if (loading) {
        return (
            <div className="main-wrapper course-details-page text-center py-5">
                <div className="spinner-border text-emerald-500" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="main-wrapper course-details-page text-center py-5">
                <h4 className="text-xl font-bold text-gray-700">Không tìm thấy khóa học</h4>
            </div>
        );
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
        }).format(price).replace('₫', 'đ');
    };

    const courseImage = course.thumbnail.startsWith('http') ? course.thumbnail : process.env.PUBLIC_URL + course.thumbnail;

    const reviewsPerPage = 5;
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
    const totalPages = Math.ceil(reviews.length / reviewsPerPage);

    return (
        <div className="main-wrapper course-details-page bg-gray-50 min-h-screen pb-12" >

            {/* Hero Banner */}
            <section className="relative w-full bg-slate-900 pt-24 pb-32 xl:pt-28 xl:pb-40">
                {/* Background overlay image (optional) */}
                <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/breadcrumb-bg.jpg)` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                
                <Container className="relative z-10">
                    <Row>
                        <Col lg="12">
                            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Chi tiết khóa học</h1>
                            <div className="flex items-center text-gray-300 text-sm md:text-base font-medium">
                                <Link to={process.env.PUBLIC_URL + "/"} className="text-gray-300 hover:text-white transition-colors text-decoration-none hover:no-underline">Trang chủ</Link>
                                <i className="las la-angle-right mx-2 text-gray-500"></i>
                                <span className="text-gray-300">{course.category}</span>
                                <i className="las la-angle-right mx-2 text-gray-500"></i>
                                <span className="text-white line-clamp-1">{course.courseName}</span>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <Styles>
                <section className="course-details-area -mt-16 relative z-20">
                    <Container>
                        <Row>
                            <Col lg="9" md="8" sm="12" className="mb-5">
                                
                                {/* White Floating Card (Header Info) */}
                                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8 border border-gray-100">
                                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight">{course.courseName}</h2>
                                    
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="flex text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className={i < Math.round(reviewStats.avgRating) ? "las la-star" : "lar la-star"}></i>
                                            ))}
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">({reviewStats.totalReviews}) đánh giá</span>
                                    </div>
                                    
                                    <hr className="border-gray-100 mb-6" />
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={
                                                    (course.giangVien?.anhDaiDien || course.giangVien?.avatar)
                                                        ? ((course.giangVien.anhDaiDien || course.giangVien.avatar).startsWith('http') 
                                                            ? (course.giangVien.anhDaiDien || course.giangVien.avatar) 
                                                            : ((course.giangVien.anhDaiDien || course.giangVien.avatar).includes('/') 
                                                                ? process.env.PUBLIC_URL + (course.giangVien.anhDaiDien || course.giangVien.avatar) 
                                                                : process.env.PUBLIC_URL + `/assets/images/${(course.giangVien.anhDaiDien || course.giangVien.avatar)}`))
                                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor || 'Giảng viên')}&background=random`
                                                } 
                                                alt={course.instructor} 
                                                className="w-10 h-10 rounded-full object-cover" 
                                                onError={(e: any) => { 
                                                    e.target.onerror = null; 
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor || 'Giảng viên')}&background=random`; 
                                                }}
                                            />
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Được tạo bởi</p>
                                                <h6 className="text-sm font-bold text-slate-800 m-0">{course.instructor}</h6>
                                            </div>
                                        </div>
                                        <div className="border-l border-gray-100 pl-4 md:pl-6">
                                            <p className="text-xs text-gray-500 mb-1">Tổng số học viên</p>
                                            <h6 className="text-sm font-bold text-slate-800 m-0">{course.totalStudents ? new Intl.NumberFormat('vi-VN').format(course.totalStudents) : '0'}</h6>
                                        </div>
                                        <div className="border-l border-gray-100 pl-4 md:pl-6">
                                            <p className="text-xs text-gray-500 mb-1">Cập nhật lần cuối</p>
                                            <h6 className="text-sm font-bold text-slate-800 m-0">{course.updatedAt}</h6>
                                        </div>
                                        <div className="border-l border-gray-100 pl-4 md:pl-6">
                                            <p className="text-xs text-gray-500 mb-1">Danh mục</p>
                                            <h6 className="text-sm font-bold text-slate-800 m-0">{course.category}</h6>
                                        </div>
                                    </div>
                                </div>

                                {/* Stacked Content Wrapper */}
                                <div className="space-y-12 bg-transparent text-left">
                                    
                                    {/* Description */}
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-4">Mô tả khóa học</h3>
                                        <div className="text-gray-600 leading-relaxed text-sm md:text-base space-y-4">
                                            <p>{course.moTa || "Chưa có mô tả cho khóa học này."}</p>
                                        </div>
                                    </div>

                                    {/* What you'll learn */}
                                    {course.ketQuaHocTap && course.ketQuaHocTap.length > 0 && (
                                        <div className="bg-[#f5f7fa] rounded-xl p-6 md:p-8 border border-blue-50/50">
                                            <h3 className="text-xl font-bold text-slate-800 mb-6">Mục tiêu khóa học</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                {course.ketQuaHocTap.map((item: string, idx: number) => (
                                                    <div key={idx} className="flex items-start">
                                                        <i className="las la-check text-blue-600 mt-1 mr-3 text-xl font-black"></i>
                                                        <span className="text-slate-900 font-medium text-sm md:text-base leading-relaxed">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}



                                    {/* Curriculum */}
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-4">Chương trình học</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 font-medium">
                                            <span>{curriculum.length} chương</span>
                                            <span>•</span>
                                            <span>{curriculum.reduce((acc, curr) => acc + (curr.baiHocs?.length || 0), 0)} bài giảng</span>
                                        </div>
                                        
                                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                            {curriculum && curriculum.length > 0 ? (
                                                curriculum.map((chapter: any, index: number) => (
                                                    <div key={chapter.maChuong} className="border-b border-gray-200 last:border-0">
                                                        <button 
                                                            className={`w-full flex items-center justify-between p-4 md:p-5 transition-colors text-left focus:outline-none border-0 ${expandedChapters.includes(chapter.maChuong) ? 'bg-emerald-50/50' : 'bg-gray-50 hover:bg-gray-100'}`}
                                                            onClick={() => toggleChapter(chapter.maChuong)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <i className={`las la-angle-down text-gray-500 font-bold text-lg transition-transform duration-300 ${expandedChapters.includes(chapter.maChuong) ? 'rotate-180' : ''}`}></i>
                                                                <span className={`font-semibold ${expandedChapters.includes(chapter.maChuong) ? 'text-emerald-800' : 'text-slate-800'}`}>{chapter.tenChuong}</span>
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-500 hidden sm:block">{chapter.baiHocs?.length || 0} bài giảng</span>
                                                        </button>
                                                        
                                                        <div 
                                                            className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedChapters.includes(chapter.maChuong) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                                        >
                                                            <div className="p-0 bg-white">
                                                                <ul className="m-0 p-0 list-none">
                                                                    {chapter.baiHocs?.map((baiHoc: any, idx: number) => (
                                                                        <li key={baiHoc.maBH} className="flex items-center justify-between px-5 py-4 border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                                                            <div className="flex items-center gap-3 text-gray-600">
                                                                                {baiHoc.choPhepXemTruoc ? (
                                                                                    <i className="las la-play-circle text-xl text-emerald-500"></i>
                                                                                ) : (
                                                                                    <i className="las la-file-alt text-xl text-gray-300"></i>
                                                                                )}
                                                                                <span className="text-sm font-medium text-slate-700">{baiHoc.tenBaiHoc}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
                                                                                {baiHoc.thoiLuong > 0 && (
                                                                                    <span>{Math.round(baiHoc.thoiLuong / 60)} phút</span>
                                                                                )}
                                                                                {baiHoc.choPhepXemTruoc ? (
                                                                                    <button 
                                                                                        onClick={() => setPreviewVideo(baiHoc.videoUrl)}
                                                                                        className="text-emerald-600 hover:text-emerald-700 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-sm transition-colors border-0"
                                                                                    >
                                                                                        Xem trước
                                                                                    </button>
                                                                                ) : (
                                                                                    <i className="las la-lock text-gray-400"></i>
                                                                                )}
                                                                            </div>
                                                                        </li>
                                                                    ))}
                                                                    {(!chapter.baiHocs || chapter.baiHocs.length === 0) && (
                                                                        <li className="px-5 py-4 border-t border-gray-100 text-sm text-gray-400 italic">
                                                                            Chưa có bài học nào trong chương này.
                                                                        </li>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-gray-500 bg-gray-50 border-2 border-dashed border-gray-200">
                                                    <i className="las la-folder-open text-4xl mb-2 text-gray-300"></i>
                                                    <p className="m-0">Khóa học này hiện chưa có bài giảng.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Requirements */}
                                    {course.yeuCauKhoaHoc && course.yeuCauKhoaHoc.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-4">Yêu cầu của khóa học</h3>
                                            <ul className="space-y-2 m-0 p-0 pl-4 list-none">
                                                {course.yeuCauKhoaHoc.map((item: string, idx: number) => (
                                                    <li key={idx} className="flex items-center text-gray-600 text-sm md:text-base relative before:content-[''] before:w-1.5 before:h-1.5 before:bg-gray-500 before:rounded-full before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2">
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Instructors */}
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-6">{t('course.instructor', 'Giảng viên')}</h3>
                                        <div className="border border-gray-100 rounded-xl p-6 md:p-8 bg-white shadow-sm">
                                            <div className="flex flex-col md:flex-row gap-6 mb-6">
                                                <img 
                                                    src={
                                                        (course?.giangVien?.anhDaiDien || course?.giangVien?.avatar)
                                                            ? ((course.giangVien.anhDaiDien || course.giangVien.avatar).startsWith('http') 
                                                                ? (course.giangVien.anhDaiDien || course.giangVien.avatar) 
                                                                : ((course.giangVien.anhDaiDien || course.giangVien.avatar).includes('/') 
                                                                    ? process.env.PUBLIC_URL + (course.giangVien.anhDaiDien || course.giangVien.avatar) 
                                                                    : process.env.PUBLIC_URL + `/assets/images/${(course.giangVien.anhDaiDien || course.giangVien.avatar)}`))
                                                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(course?.giangVien?.tenGiangVien || course?.instructor || 'Giảng viên')}&background=random`
                                                    } 
                                                    alt={course?.giangVien?.tenGiangVien || course?.instructor} 
                                                    className="w-28 h-28 object-cover rounded-lg" 
                                                    onError={(e: any) => { 
                                                        e.target.onerror = null; 
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(course?.giangVien?.tenGiangVien || course?.instructor || 'Giảng viên')}&background=random`; 
                                                    }}
                                                />
                                                <div>
                                                    <h4 className="text-lg font-bold text-slate-800 mb-1 m-0">{course?.giangVien?.tenGiangVien || course?.instructor}</h4>
                                                    <p className="text-sm text-gray-500 mb-3 m-0">{course?.giangVien?.chuyenMon || t('instructor.expert', 'Chuyên gia đào tạo')}</p>
                                                    <div className="flex items-center text-sm font-medium text-amber-400 mb-2">
                                                        <i className="las la-star mr-1 text-lg"></i>
                                                        {reviewStats.avgRating} <span className="text-gray-500 ml-1 font-normal">({reviewStats.totalReviews} {t('course.reviews_count', 'đánh giá')})</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span className="flex items-center"><i className="las la-play-circle text-lg mr-1 text-gray-400"></i> {course?.giangVien?.totalCourses || 0} {t('course.courses', 'Khóa học')}</span>
                                                        <span className="flex items-center"><i className="las la-user-friends text-lg mr-1 text-gray-400"></i> {course?.giangVien?.totalStudents || 0} {t('course.students', 'Học viên')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-sm md:text-base leading-relaxed m-0">
                                                {course?.giangVien?.tieuSu || t('instructor.no_bio', 'Chưa có thông tin tiểu sử.')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Student Feedback & Reviews Dashboard */}
                                    <div ref={reviewsSectionRef} className="scroll-mt-28">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-800 m-0">{t('course.reviews', 'Nhận xét')}</h3>
                                        </div>

                                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 mb-8">
                                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                                <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-xl text-center">
                                                    <h2 className="text-6xl font-black text-slate-900 mb-2 m-0">{reviewStats.avgRating}</h2>
                                                    <div className="flex items-center gap-1 mb-2">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={20} fill={i < Math.round(reviewStats.avgRating) ? "#FBBF24" : "transparent"} className={i < Math.round(reviewStats.avgRating) ? "text-[#FBBF24]" : "text-slate-300"} />
                                                        ))}
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-500 m-0">{t('reviews.total', 'Tổng cộng')} {reviewStats.totalReviews} {t('reviews.ratings', 'đánh giá')}</p>
                                                </div>
                                                
                                                <div className="w-full md:w-2/3 space-y-3">
                                                    {reviewStats.bars.map((bar, i) => (
                                                        <div key={i} className="flex items-center gap-4">
                                                            <div className="flex items-center justify-end gap-1 w-24 text-sm font-medium text-slate-600">
                                                                {bar.stars} <Star size={14} fill="#FBBF24" className="text-[#FBBF24]" />
                                                            </div>
                                                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: bar.pct }}></div>
                                                            </div>
                                                            <div className="w-12 text-right text-sm font-medium text-slate-500">{bar.pct}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Filter Tabs */}
                                            <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-slate-100">
                                                <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 border-0 ${activeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{t('filter.all', 'Tất cả')}</button>
                                                <button onClick={() => setActiveFilter('5')} className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 border-0 ${activeFilter === '5' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{t('filter.5star', '5 sao')}</button>
                                                <button onClick={() => setActiveFilter('4')} className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 border-0 ${activeFilter === '4' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{t('filter.4star', '4 sao')}</button>
                                                <button onClick={() => setActiveFilter('has_comment')} className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 border-0 ${activeFilter === 'has_comment' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{t('filter.with_comment', 'Có bình luận')}</button>
                                                <button onClick={() => setActiveFilter('latest')} className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 border-0 ${activeFilter === 'latest' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{t('filter.latest', 'Mới nhất')}</button>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm mb-10 divide-y divide-slate-100">
                                            {currentReviews.length > 0 ? (
                                                currentReviews.map((review: any, idx: number) => {
                                                    const reviewReplies = review.replies || [];
                                                    console.log('>>> Data Review kèm Replies ngoài sàn:', reviewReplies);
                                                    return (
                                                        <div key={review.reviewId || idx} className="p-6 transition hover:bg-slate-50/30">
                                                            <div className="flex gap-4">
                                                                <div className="flex-shrink-0">
                                                                    {review.studentAvatar ? (
                                                                        <img 
                                                                            src={review.studentAvatar.startsWith('http') ? review.studentAvatar : process.env.PUBLIC_URL + review.studentAvatar} 
                                                                            alt={review.studentName} 
                                                                            className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover" 
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700">
                                                                            {(review.studentName || 'U').charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex flex-col gap-1 md:flex-row md:items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <h3 className="text-[14px] font-bold text-slate-900 m-0">
                                                                                {review.studentName}
                                                                            </h3>
                                                                            <span className="text-[12px] text-slate-400 font-medium whitespace-nowrap">
                                                                                {getTimeAgo(review.createdAt)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-0.5">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <Star key={i} size={14} fill={i < review.rating ? "#FBBF24" : "transparent"} className={i < review.rating ? "text-[#FBBF24]" : "text-slate-300"} />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <p className="mt-2 text-[14px] leading-relaxed text-slate-700 m-0">
                                                                        {review.content || t('reviews.no_content', 'Không có nội dung đánh giá.')}
                                                                    </p>

                                                                    {/* Replies Thread */}
                                                                    {reviewReplies.length > 0 && (
                                                                        <div className="mt-4 space-y-3">
                                                                            {reviewReplies.map((reply: any, rIdx: number) => {
                                                                                const instructorName = (reply.studentName || 'Giảng viên').trim();
                                                                                const rawAvatar = reply.studentAvatar;
                                                                                const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName)}&background=04a557&color=fff&bold=true&size=80`;
                                                                                
                                                                                let avatarSrc = avatarFallback;
                                                                                if (rawAvatar && rawAvatar !== 'null' && rawAvatar.trim() !== '') {
                                                                                    avatarSrc = rawAvatar.startsWith('http') ? rawAvatar : `/assets/images/${rawAvatar}`;
                                                                                }

                                                                                return (
                                                                                    <div 
                                                                                        key={reply.reviewId || reply.id || rIdx} 
                                                                                        className="ml-6 md:ml-8 p-4 rounded-xl transition-all duration-300"
                                                                                        style={{
                                                                                            backgroundColor: isDarkMode ? '#062f1d' : '#f0fbf5',
                                                                                            borderColor: isDarkMode ? 'rgba(6, 78, 59, 0.3)' : '#d4edda',
                                                                                            borderStyle: 'solid',
                                                                                            borderWidth: '1px'
                                                                                        }}
                                                                                    >
                                                                                        <div className="d-flex align-items-center gap-2 mb-2 flex flex-row items-center">
                                                                                            <img 
                                                                                                src={avatarSrc} 
                                                                                                alt="Giảng viên" 
                                                                                                className="rounded-circle rounded-full"
                                                                                                style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                                                                                                onError={(e: any) => {
                                                                                                    if ((e.target as HTMLImageElement).src !== avatarFallback) {
                                                                                                        (e.target as HTMLImageElement).src = avatarFallback;
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                            <strong className="text-emerald-700" style={{ color: isDarkMode ? '#34d399' : '#04a557', fontSize: '14px' }}>
                                                                                                {instructorName}
                                                                                            </strong>
                                                                                            <span className="badge bg-success-subtle text-success border border-success-subtle ms-1" style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#d1e7dd', color: isDarkMode ? '#6ee7b7' : '#0f5132', borderColor: isDarkMode ? 'transparent' : '#badbcc' }}>
                                                                                                Giảng viên
                                                                                            </span>
                                                                                            <span className="text-muted text-slate-500 small ms-auto ml-auto text-xs">
                                                                                                {getTimeAgo(reply.createdAt || reply.ngayTao)}
                                                                                            </span>
                                                                                        </div>
                                                                                        <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155', margin: '4px 0 0 0', fontSize: '14px', lineHeight: '1.6' }}>{reply.content || reply.noiDung}</p>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <div className="p-12 text-center bg-white rounded-xl border-0">
                                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
                                                        <i className="las la-comment-alt text-2xl"></i>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-slate-700 m-0 mb-1">{t('reviews.empty_title', 'Chưa có đánh giá nào')}</h3>
                                                    <p className="text-sm text-slate-500 m-0">{t('reviews.empty_desc', 'Hãy là người đầu tiên nhận xét khóa học này.')}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex justify-center items-center gap-2 mb-10">
                                                <button 
                                                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${currentPage === 1 ? 'text-slate-400 bg-slate-100 cursor-not-allowed' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    {t('pagination.prev', 'Trước')}
                                                </button>
                                                
                                                <div className="flex gap-1">
                                                    {[...Array(totalPages)].map((_, i) => (
                                                        <button 
                                                            key={i + 1}
                                                            onClick={() => handlePageChange(i + 1)}
                                                            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${currentPage === i + 1 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button 
                                                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${currentPage === totalPages ? 'text-slate-400 bg-slate-100 cursor-not-allowed' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    {t('pagination.next', 'Sau')}
                                                </button>
                                            </div>
                                        )}

                                        {!isInstructorOrAdmin && (
                                            <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-100">
                                                {!isLoggedIn ? (
                                                    <div className="text-center py-8">
                                                        <p className="text-slate-600 mb-4">{t('reviews.login_required', 'Đăng nhập để nhận xét')}</p>
                                                        <Link to="/login" state={{ from: `/course-details/${id}` }} className="inline-block bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-8 rounded-lg transition-colors border-0">
                                                            {t('reviews.login_btn', 'Đăng nhập để nhận xét')}
                                                        </Link>
                                                    </div>
                                                ) : isOwned || isEnrolled ? (
                                                    <>
                                                        <h3 className="text-lg font-bold text-slate-800 mb-2 m-0">{t('reviews.write_review', 'Viết đánh giá của bạn')}</h3>
                                                        <p className="text-sm text-slate-500 mb-6 m-0">{t('reviews.required_fields', 'Các trường bắt buộc được đánh dấu *')}</p>
                                                        
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <span className="text-[14px] font-semibold text-slate-700">{t('reviews.rating', 'Đánh giá tổng quan *')}</span>
                                                            <div className="flex cursor-pointer gap-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <Star 
                                                                        key={star} 
                                                                        size={20}
                                                                        fill={star <= reviewForm.soSao ? "#FBBF24" : "transparent"} 
                                                                        className={`transition-transform duration-200 hover:scale-110 ${star <= reviewForm.soSao ? "text-[#FBBF24]" : "text-slate-300"}`}
                                                                        onClick={() => setReviewForm({ ...reviewForm, soSao: star })}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        
                                                        <form className="space-y-4" onSubmit={handleReviewSubmit}>
                                                            <textarea 
                                                                rows={4} 
                                                                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none" 
                                                                placeholder={t('reviews.placeholder', 'Nội dung nhận xét của bạn *')}
                                                                value={reviewForm.noiDung}
                                                                onChange={(e) => setReviewForm({ ...reviewForm, noiDung: e.target.value })}
                                                                required
                                                                style={{ color: '#334155' }}
                                                            ></textarea>
                                                            <button type="submit" className="bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-8 rounded-lg transition-colors border-0">
                                                                {t('reviews.submit', 'Gửi đánh giá')}
                                                            </button>
                                                        </form>
                                                    </>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <p className="text-slate-600 mb-4">{t('reviews.enroll_required', 'Vui lòng đăng ký khóa học để chia sẻ cảm nhận của bạn.')}</p>
                                                        <button 
                                                            onClick={() => navigate(`/checkout/${course.id}`, { state: { selectedCourses: [course] } })}
                                                            className="inline-block bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-8 rounded-lg transition-colors border-0"
                                                        >
                                                            {t('reviews.enroll_btn', 'Đăng ký ngay')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                </div>
                            </Col>

                            {/* RIGHT SIDEBAR (Kept Intact) */}
                            <Col lg="3" md="4" sm="12">
                                <div className="single-details-sidbar mt-8 md:mt-0 sticky top-24">
                                    <Row>
                                        <Col md="12">
                                            <div className="course-details-feature">
                                                <h5 className="title">Chi tiết khóa học</h5>
                                                <ul className="list-unstyled feature-list">
                                                    <li><i className="las la-calendar"></i> Ngày cập nhật: <span>{course?.updatedAt || 'N/A'}</span></li>
                                                    <li><i className="las la-globe"></i> Ngôn ngữ: <span>{course?.language || 'Tiếng Việt'}</span></li>
                                                    <li><i className="las la-sort-amount-up"></i> Cấp độ: <span>{course?.level || 'Mọi cấp độ'}</span></li>
                                                    <li><i className="las la-graduation-cap"></i> Chủ đề: <span>{course?.category || 'Chung'}</span></li>
                                                    <li><i className="las la-book"></i> Bài giảng: <span>{curriculum?.reduce((acc, curr) => acc + (curr.baiHocs?.length || 0), 0) || 0}</span></li>
                                                    <li><i className="las la-bookmark"></i> Đã tham gia: <span>{course?.totalStudents ? new Intl.NumberFormat('vi-VN').format(course.totalStudents) : 0}</span></li>
                                                    <li><i className="las la-certificate"></i> Chứng chỉ: <span>Có</span></li>
                                                </ul>

                                                <div className="mt-6 mb-2 border-t border-gray-100 pt-6">
                                                    <h3 className="text-3xl font-bold text-[#30263f] mb-4">
                                                        {formatPrice(course.price)}
                                                    </h3>
                                                    {isOwned ? (
                                                        <div className="d-flex flex-column gap-3 mb-3">
                                                            <button 
                                                                type="button" 
                                                                className="w-100 bg-[#10B981] hover:bg-[#059669] text-white font-bold border-0 transition-colors shadow-sm" 
                                                                style={{ height: '54px', borderRadius: '12px', fontSize: '18px' }}
                                                                onClick={() => navigate(`/student/learn/${course.id}`)}
                                                            >
                                                                <i className="las la-play-circle mr-2 text-2xl align-middle"></i>
                                                                Vào học ngay
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="d-flex align-items-center gap-2 mb-3">
                                                                <button 
                                                                    type="button" 
                                                                    className="flex-grow-1 bg-white hover:bg-purple-50 text-[#5a31a8] font-bold border border-[#5a31a8] transition-colors" 
                                                                    style={{ height: '48px', borderRadius: '8px' }}
                                                                    onClick={() => {
                                                                        dispatch(addToCart(course));
                                                                        toast.success('Đã thêm vào giỏ hàng!');
                                                                    }}
                                                                >
                                                                    Thêm vào giỏ hàng
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    className={`d-flex align-items-center justify-content-center transition-colors border ${wishlistItems.some(item => item.id === course?.id) ? 'bg-[#5a31a8] hover:bg-[#4a278a] text-white border-[#5a31a8]' : 'bg-white hover:bg-purple-50 text-[#5a31a8] border-[#5a31a8]'}`} 
                                                                    style={{ width: '48px', height: '48px', borderRadius: '8px', padding: '0' }} 
                                                                    onClick={(e) => {
                                                                        e.currentTarget.blur();
                                                                        const isWishlisted = wishlistItems.some(item => item.id === course?.id);
                                                                        dispatch(toggleWishlist(course));
                                                                        if (isWishlisted) {
                                                                            toast.success('Đã gỡ khỏi danh sách yêu thích!');
                                                                        } else {
                                                                            toast.success('Đã thêm vào danh sách yêu thích!');
                                                                        }
                                                                    }}
                                                                    title="Thêm vào yêu thích"
                                                                >
                                                                    <i className={wishlistItems.some(item => item.id === course?.id) ? "las la-heart" : "lar la-heart"} style={{ fontSize: '24px' }}></i>
                                                                </button>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                className="w-100 bg-white hover:bg-purple-50 text-[#5a31a8] font-bold border border-[#5a31a8] transition-colors" 
                                                                style={{ height: '48px', borderRadius: '8px' }}
                                                                onClick={() => {
                                                                    const user = localStorage.getItem('user');
                                                                    if (!user) {
                                                                        toast.error('Vui lòng đăng nhập để tiếp tục thanh toán');
                                                                        navigate('/login', { state: { from: `/checkout/${course.id}` } });
                                                                    } else {
                                                                        navigate(`/checkout/${course.id}`, { state: { selectedCourses: [course] } });
                                                                    }
                                                                }}
                                                            >
                                                                Mua ngay
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md="12">
                                            <PopularCourse />
                                        </Col>
                                        <Col md="12">
                                            <CourseTag />
                                        </Col>
                                    </Row>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </Styles>

            {/* Preview Video Modal */}
            {previewVideo && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl relative">
                        <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-white">
                            <h3 className="text-slate-800 font-bold m-0 text-lg">Xem trước bài giảng</h3>
                            <button 
                                onClick={() => setPreviewVideo(null)}
                                className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center border-0 text-xl"
                            >
                                <i className="las la-times"></i>
                            </button>
                        </div>
                        <div className="aspect-video w-full bg-black relative">
                            {previewVideo ? (
                                <iframe 
                                    src={previewVideo.includes('youtube.com') && !previewVideo.includes('autoplay=1') ? previewVideo + (previewVideo.includes('?') ? '&' : '?') + 'autoplay=1' : previewVideo} 
                                    className="w-full h-full border-0 absolute inset-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="flex items-center justify-center h-full text-white">
                                    <p>Không có video xem trước</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}

export default CourseDetails
