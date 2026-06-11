import React, { useState, useEffect, Fragment } from 'react';
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

function CourseDetails() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
    
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                const response: any = await axiosClient.get(`/public/courses/${id}`);
                if (response && response.data) {
                    let parsedKetQua = [];
                    let parsedYeuCau = [];
                    try { if (response.data.ketQuaHocTap) parsedKetQua = JSON.parse(response.data.ketQuaHocTap); } catch(e){}
                    try { if (response.data.yeuCauKhoaHoc) parsedYeuCau = JSON.parse(response.data.yeuCauKhoaHoc); } catch(e){}

                    setCourse({
                        id: parseInt(response.data.maKH),
                        courseName: response.data.tenKhoaHoc,
                        thumbnail: response.data.hinhThuNho || '/assets/images/course-1.jpg',
                        instructor: response.data.giangVien ? `${response.data.giangVien.firstName || ''} ${response.data.giangVien.lastName || ''}`.trim() : 'Unknown Instructor',
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
                        updatedAt: response.data.updatedAt || '01 January 2022'
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

    const toggleAccordion = (e: React.MouseEvent<HTMLButtonElement>) => {
        const button = e.currentTarget;
        button.classList.toggle("active");
        const content = button.nextElementSibling as HTMLElement | null;

        if (!content) return;

        if (button.classList.contains("active")) {
            content.style.maxHeight = content.scrollHeight + "px";
        } else {
            content.style.maxHeight = "0";
        }
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
                            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Courses</h1>
                            <div className="flex items-center text-gray-300 text-sm md:text-base font-medium">
                                <Link to={process.env.PUBLIC_URL + "/"} className="text-gray-300 hover:text-white transition-colors text-decoration-none hover:no-underline">Home</Link>
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
                                            <i className="las la-star"></i>
                                            <i className="las la-star"></i>
                                            <i className="las la-star"></i>
                                            <i className="las la-star"></i>
                                            <i className="las la-star-half-alt"></i>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">(28) đánh giá</span>
                                    </div>
                                    
                                    <hr className="border-gray-100 mb-6" />
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="flex items-center gap-3">
                                            <img src={process.env.PUBLIC_URL + `/assets/images/author.jpg`} alt={course.instructor} className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Được tạo bởi</p>
                                                <h6 className="text-sm font-bold text-slate-800 m-0">{course.instructor}</h6>
                                            </div>
                                        </div>
                                        <div className="border-l border-gray-100 pl-4 md:pl-6">
                                            <p className="text-xs text-gray-500 mb-1">Tổng số học viên</p>
                                            <h6 className="text-sm font-bold text-slate-800 m-0">5,420</h6>
                                        </div>
                                        <div className="border-l border-gray-100 pl-4 md:pl-6">
                                            <p className="text-xs text-gray-500 mb-1">Cập nhật lần cuối</p>
                                            <h6 className="text-sm font-bold text-slate-800 m-0">01 Th01, 2022</h6>
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
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Curriculum</h3>
                                        <p className="text-sm text-gray-500 mb-6">{course.baiHocs?.length || 0} lectures</p>
                                        
                                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                            {course.baiHocs && course.baiHocs.length > 0 ? (
                                                <div className="border-b border-gray-200 last:border-0">
                                                    <button 
                                                        className="w-full flex items-center justify-between p-4 md:p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left font-semibold text-slate-800 focus:outline-none border-0 active"
                                                        onClick={toggleAccordion}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <i className="las la-minus text-gray-400 font-bold text-lg"></i>
                                                            <span>Nội dung khóa học</span>
                                                        </div>
                                                        <span className="text-sm font-normal text-gray-500 hidden sm:block">{course.baiHocs.length} lectures</span>
                                                    </button>
                                                    <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: '1000px' }}>
                                                        <div className="p-0">
                                                            <ul className="m-0 p-0 list-none">
                                                                {course.baiHocs.map((baiHoc: any, index: number) => (
                                                                    <li key={index} className="flex items-center justify-between px-5 py-4 border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                                                        <div className="flex items-center gap-3 text-gray-500">
                                                                            <i className="las la-play-circle text-xl text-gray-300"></i>
                                                                            <span className="text-sm font-medium">{baiHoc.tenBaiHoc}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-gray-400 text-sm">
                                                                            <span>{baiHoc.thoiLuong ? `${baiHoc.thoiLuong}m` : ''}</span>
                                                                            <i className="las la-lock"></i>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-5 text-center text-gray-500">
                                                    Khóa học này hiện chưa có bài giảng.
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
                                        <h3 className="text-xl font-bold text-slate-800 mb-6">Giảng viên</h3>
                                        <div className="border border-gray-100 rounded-xl p-6 md:p-8 bg-white shadow-sm">
                                            <div className="flex flex-col md:flex-row gap-6 mb-6">
                                                <img src={process.env.PUBLIC_URL + `/assets/images/instructor-3.jpg`} alt={course.instructor} className="w-28 h-28 object-cover rounded-lg" />
                                                <div>
                                                    <h4 className="text-lg font-bold text-slate-800 mb-1 m-0">{course.instructor}</h4>
                                                    <p className="text-sm text-gray-500 mb-3 m-0">Chuyên gia dữ liệu, BDervs Ltd.</p>
                                                    <div className="flex items-center text-sm font-medium text-amber-400 mb-2">
                                                        <i className="las la-star mr-1 text-lg"></i>
                                                        4.7 <span className="text-gray-500 ml-1 font-normal">(54 đánh giá)</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span className="flex items-center"><i className="las la-play-circle text-lg mr-1 text-gray-400"></i> 3 Khóa học</span>
                                                        <span className="flex items-center"><i className="las la-user-friends text-lg mr-1 text-gray-400"></i> 78,742 Học viên</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-sm md:text-base leading-relaxed m-0">
                                                Về chuyên môn, tôi đến từ lĩnh vực tư vấn Khoa học dữ liệu với kinh nghiệm trong tài chính, bán lẻ, giao thông và các ngành công nghiệp khác. Tôi đã được đào tạo bởi những cố vấn phân tích tốt nhất tại Deloitte Australia và kể từ khi bắt đầu giảng dạy trực tuyến, tôi đã truyền đạt kiến thức của mình cho học viên trên toàn thế giới.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Student Feedback */}
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-6">Phản hồi từ học viên</h3>
                                        <div className="flex flex-col md:flex-row gap-8 items-center">
                                            <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-8 bg-white border border-gray-100 rounded-xl shadow-sm text-center">
                                                <h2 className="text-6xl font-bold text-amber-400 mb-2 m-0">4.7</h2>
                                                <div className="flex text-amber-400 mb-2 text-lg">
                                                    <i className="las la-star"></i>
                                                    <i className="las la-star"></i>
                                                    <i className="las la-star"></i>
                                                    <i className="las la-star"></i>
                                                    <i className="las la-star-half-alt"></i>
                                                </div>
                                                <p className="text-sm font-medium text-gray-500 m-0">5785 Đánh giá</p>
                                            </div>
                                            
                                            <div className="w-full md:w-2/3 space-y-3">
                                                {[
                                                    { stars: 5, pct: '98%' },
                                                    { stars: 4, pct: '78%' },
                                                    { stars: 3, pct: '55%' },
                                                    { stars: 2, pct: '60%' },
                                                    { stars: 1, pct: '10%' }
                                                ].map((bar, i) => (
                                                    <div key={i} className="flex items-center gap-4">
                                                        <div className="flex text-amber-400 text-sm w-20 justify-end">
                                                            {[...Array(bar.stars)].map((_, j) => <i key={j} className="las la-star"></i>)}
                                                        </div>
                                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-600 rounded-full" style={{ width: bar.pct }}></div>
                                                        </div>
                                                        <div className="w-10 text-right text-sm font-medium text-gray-500">{bar.pct}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reviews */}
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-6">Nhận xét</h3>
                                        
                                        <div className="space-y-6 mb-10">
                                            {/* Review 1 */}
                                            <div className="flex gap-4">
                                                <img src={process.env.PUBLIC_URL + `/assets/images/testimonial-2.jpg`} alt="Reviewer" className="w-12 h-12 rounded-full object-cover" />
                                                <div>
                                                    <h6 className="font-bold text-slate-800 text-sm m-0 mb-1">Sotapdi Kunda</h6>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex text-amber-400 text-xs">
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                        </div>
                                                        <span className="text-xs text-gray-400">55 phút trước</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed m-0">Rất rõ ràng và có tổ chức với các hướng dẫn dễ làm theo, bài tập và giải pháp. Khóa học này bắt đầu từ mức cơ bản nhất với rất ít kiến thức và cung cấp cái nhìn tổng quan tuyệt vời về các công cụ phổ biến cho khoa học dữ liệu, tiến tới các khái niệm và ý tưởng phức tạp hơn.</p>
                                                </div>
                                            </div>

                                            <hr className="border-gray-100 m-0" />

                                            {/* Review 2 */}
                                            <div className="flex gap-4">
                                                <img src={process.env.PUBLIC_URL + `/assets/images/testimonial-1.jpg`} alt="Reviewer" className="w-12 h-12 rounded-full object-cover" />
                                                <div>
                                                    <h6 className="font-bold text-slate-800 text-sm m-0 mb-1">Samantha</h6>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex text-amber-400 text-xs">
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                        </div>
                                                        <span className="text-xs text-gray-400">45 phút trước</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed m-0">Khóa học giải thích rất tốt tư duy cơ bản của các khái niệm. Nó sẽ giúp bạn hiểu các nền tảng căn bản, điều làm khóa học này độc đáo là các phương pháp triển khai được định nghĩa rất rõ ràng. Cảm ơn đội ngũ !</p>
                                                </div>
                                            </div>

                                            <hr className="border-gray-100 m-0" />

                                            {/* Review 3 */}
                                            <div className="flex gap-4">
                                                <img src={process.env.PUBLIC_URL + `/assets/images/testimonial-3.jpg`} alt="Reviewer" className="w-12 h-12 rounded-full object-cover" />
                                                <div>
                                                    <h6 className="font-bold text-slate-800 text-sm m-0 mb-1">Michell Mariya</h6>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex text-amber-400 text-xs">
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                            <i className="las la-star"></i>
                                                        </div>
                                                        <span className="text-xs text-gray-400">30 phút trước</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed m-0">Khóa học này thật tuyệt vời..! Tôi bắt đầu khóa học này như một người mới và đã học được rất nhiều điều. Giảng viên rất giỏi. Việc xử lý câu hỏi cần cải thiện đôi chút. Nhìn chung rất hài lòng với khóa học.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors mb-8 border-0">
                                            Viết đánh giá
                                        </button>

                                        {/* Write Review Form */}
                                        <div>
                                            <p className="text-sm text-gray-500 mb-6 m-0">Địa chỉ email của bạn sẽ không được công bố. Các trường bắt buộc được đánh dấu *</p>
                                            <div className="flex items-center gap-2 mb-6 mt-4">
                                                <span className="text-sm font-medium text-gray-600">Đánh giá tổng quan</span>
                                                <div className="flex text-amber-400 cursor-pointer text-lg">
                                                    <i className="las la-star"></i>
                                                    <i className="las la-star"></i>
                                                    <i className="las la-star"></i>
                                                    <i className="las la-star"></i>
                                                    <i className="lar la-star"></i>
                                                </div>
                                            </div>
                                            
                                            <form className="space-y-4">
                                                <textarea 
                                                    rows={6} 
                                                    className="w-full bg-white border border-gray-300 rounded-lg p-4 text-sm text-slate-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none mb-4" 
                                                    placeholder="Nhận xét của bạn"
                                                ></textarea>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-white border border-gray-300 rounded-lg p-4 text-sm text-slate-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                                                        placeholder="Tên của bạn"
                                                    />
                                                    <input 
                                                        type="email" 
                                                        className="w-full bg-white border border-gray-300 rounded-lg p-4 text-sm text-slate-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                                                        placeholder="Email của bạn"
                                                    />
                                                </div>
                                                <button type="button" className="bg-blue-600 text-white font-medium py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors mt-2 border-0">
                                                    Gửi
                                                </button>
                                            </form>
                                        </div>
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
                                                    <li><i className="las la-calendar"></i> Ngày bắt đầu: <span>21 Th08, 2020</span></li>
                                                    <li><i className="las la-clock"></i> Thời lượng: <span>1 Năm</span></li>
                                                    <li><i className="las la-globe"></i> Ngôn ngữ: <span>Tiếng Anh</span></li>
                                                    <li><i className="las la-sort-amount-up"></i> Cấp độ: <span>Cơ bản</span></li>
                                                    <li><i className="las la-graduation-cap"></i> Chủ đề: <span>Web</span></li>
                                                    <li><i className="las la-book"></i> Bài giảng: <span>51</span></li>
                                                    <li><i className="las la-bookmark"></i> Đã tham gia: <span>236</span></li>
                                                    <li><i className="las la-certificate"></i> Chứng chỉ: <span>Có</span></li>
                                                </ul>

                                                <div className="mt-6 mb-2 border-t border-gray-100 pt-6">
                                                    <h3 className="text-3xl font-bold text-[#30263f] mb-4">
                                                        {formatPrice(course.price)}
                                                    </h3>
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
                                                                navigate(`/checkout/${course.id}`);
                                                            }
                                                        }}
                                                    >
                                                        Mua ngay
                                                    </button>
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
        </div >
    )
}

export default CourseDetails
