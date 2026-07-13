import React, { useState, useEffect } from 'react';
import Datas from '../data/course/slider.json';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Swiper from 'react-id-swiper';
import { Styles } from "./styles/courseSlider";
import axiosClient from '../../../api/axios';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, addToCartThunk } from '../../cart/cartSlice';
import { toggleWishlist, toggleWishlistThunk } from '../../wishlist/wishlistSlice';
import { RootState } from '../../../store/store';
import toast from 'react-hot-toast';

const formatPrice = (price: any) => {
    if (!price) return '0 đ';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString('vi-VN') + ' đ';
};

const CourseSlider = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const dispatch = useDispatch();
    const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response: any = await axiosClient.get('/public/courses');
                if (response && response.data) {
                    setCourses(response.data);
                }
            } catch (error) {
                console.error("Error fetching courses", error);
            }
        };
        fetchCourses();
    }, []);

    // Fix for Vite CommonJS interop with react-id-swiper
    const SwiperComponent = (Swiper && typeof Swiper === 'object' && 'default' in Swiper) ? (Swiper as any).default : Swiper;

    const settings = {
        slidesPerView: 3,
        loop: true,
        speed: 1000,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false
        },
        spaceBetween: 30,
        watchSlidesVisibility: true,
        pagination: {
            el: '.slider-dot.text-center',
            clickable: true
        },
        breakpoints: {
            0: {
                slidesPerView: 1
            },
            576: {
                slidesPerView: 1
            },
            768: {
                slidesPerView: 2
            },
            992: {
                slidesPerView: 3
            }
        }
    };

    const displayCourses = courses.length > 0 ? courses : [];

    return (
        <Styles>
            <section className="course-slider-area">
                <Container>
                    <Row>
                        <Col md="12">
                            <div className="sec-title text-center">
                                <h4>{Datas.secTitle}</h4>
                            </div>
                        </Col>
                        <Col md="12">
                            <div className="course-slider">
                                {displayCourses.length > 0 ? (
                                    <SwiperComponent {...settings}>
                                        {
                                            displayCourses.map((data: any, i: number) => {
                                                const instructorName = data.giangVien?.hoTen || 'Giảng viên chưa rõ';
                                                const rawAvatar = data.giangVien?.anhDaiDien;
                                                const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName)}&background=random`;
                                                let instructorAvatar = defaultAvatar;
                                                if (rawAvatar && rawAvatar !== 'null' && rawAvatar.trim() !== '') {
                                                    if (rawAvatar.startsWith('http')) {
                                                        instructorAvatar = rawAvatar;
                                                    } else if (rawAvatar.includes('/')) {
                                                        instructorAvatar = process.env.PUBLIC_URL + rawAvatar;
                                                    } else {
                                                        instructorAvatar = process.env.PUBLIC_URL + `/assets/images/${rawAvatar}`;
                                                    }
                                                }
                                                const categoryName = data.danhMuc?.tenDM || 'General';
                                                const rawImage = data.hinhThuNho;
                                                const courseImage = rawImage ? (rawImage.startsWith('http') ? rawImage : process.env.PUBLIC_URL + '/assets/images/' + rawImage) : process.env.PUBLIC_URL + '/assets/images/course-1.jpg';
                                                const courseUrl = process.env.PUBLIC_URL + `/course-details/${data.maKH}`;

                                                return (
                                                    <div className="course-item px-2 py-4" key={i}>
                                                        <div className="group relative w-full rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-xl text-left">
                                                            
                                                            {/* Hover Popup Overlay */}
                                                            <div className="pointer-events-none absolute inset-0 z-50 hidden opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100 xl:block">
                                                                <div className="flex h-full w-full flex-col justify-center rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
                                                                    <div className="mb-2 text-sm font-semibold text-emerald-500">{categoryName}</div>
                                                                    <h5 className="mb-2 text-xl font-bold text-slate-800">{data.tenKhoaHoc}</h5>
                                                                    <div className="mb-3 flex items-center text-sm text-gray-500">
                                                                        <span className="mr-3"><i className="las la-clock mr-1"></i>120 Phút</span>
                                                                        <span><i className="las la-signal mr-1"></i>Mọi cấp độ</span>
                                                                    </div>
                                                                    <p className="mb-4 text-sm text-gray-600 line-clamp-3">
                                                                        {data.moTa || "Chưa có mô tả cho khóa học này."}
                                                                    </p>
                                                                    <ul className="mb-6 space-y-2 text-sm text-gray-600">
                                                                        <li className="flex items-start"><i className="las la-check text-emerald-500 mr-2 mt-0.5"></i> Video bài giảng chất lượng cao</li>
                                                                        <li className="flex items-start"><i className="las la-check text-emerald-500 mr-2 mt-0.5"></i> Tài liệu tải xuống miễn phí</li>
                                                                        <li className="flex items-start"><i className="las la-check text-emerald-500 mr-2 mt-0.5"></i> Chứng chỉ hoàn thành</li>
                                                                    </ul>
                                                                    <div className="flex gap-2">
                                                                        <Link to={courseUrl} className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-600 hover:text-white text-decoration-none hover:no-underline">
                                                                            Xem chi tiết
                                                                        </Link>
                                                                        <button 
                                                                            className="rounded-lg bg-emerald-50 px-4 text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-white"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                dispatch(addToCart({
                                                                                    id: data.maKH,
                                                                                    courseName: data.tenKhoaHoc,
                                                                                    thumbnail: courseImage,
                                                                                    instructor: instructorName,
                                                                                    price: parseFloat(data.giaBan || '0'),
                                                                                    duration: '120 Phút',
                                                                                    level: 'Mọi cấp độ',
                                                                                    category: categoryName
                                                                                }));
                                                                                const token = localStorage.getItem('access_token');
                                                                                if (token) {
                                                                                  dispatch(addToCartThunk({
                                                                                    id: data.maKH,
                                                                                    courseName: data.tenKhoaHoc,
                                                                                    thumbnail: courseImage,
                                                                                    instructor: instructorName,
                                                                                    price: parseFloat(data.giaBan || '0'),
                                                                                    duration: '120 Phút',
                                                                                    level: 'Mọi cấp độ',
                                                                                    category: categoryName
                                                                                  }) as any);
                                                                                }
                                                                                toast.success('Đã thêm vào giỏ hàng!');
                                                                            }}
                                                                        >
                                                                            <i className="las la-shopping-cart text-xl"></i>
                                                                        </button>
                                                                        <button 
                                                                            className={`rounded-lg border px-4 transition-colors ${wishlistItems.some(item => item.id === data.maKH) ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:text-red-500'}`}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                const isWishlisted = wishlistItems.some(item => item.id === data.maKH);
                                                                                const token = localStorage.getItem('access_token');
                                                                                const coursePayload = {
                                                                                    id: data.maKH,
                                                                                    courseName: data.tenKhoaHoc,
                                                                                    thumbnail: courseImage,
                                                                                    instructor: instructorName,
                                                                                    price: parseFloat(data.giaBan || '0'),
                                                                                    duration: '120 Phút',
                                                                                    level: 'Mọi cấp độ',
                                                                                    category: categoryName
                                                                                };
                                                                                if (token) {
                                                                                  dispatch(toggleWishlistThunk(coursePayload) as any);
                                                                                } else {
                                                                                  dispatch(toggleWishlist(coursePayload));
                                                                                }
                                                                                if (isWishlisted) {
                                                                                    toast.success('Đã gỡ khỏi danh sách yêu thích!');
                                                                                } else {
                                                                                    toast.success('Đã thêm vào danh sách yêu thích!');
                                                                                }
                                                                            }}
                                                                            title="Thêm vào yêu thích"
                                                                        >
                                                                            <i className={`${wishlistItems.some(item => item.id === data.maKH) ? "las la-heart" : "lar la-heart"} text-xl`}></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Main Card */}
                                                            <Link to={courseUrl} className="block overflow-hidden rounded-t-2xl">
                                                                <div className="relative h-56 w-full overflow-hidden">
                                                                    <div className="absolute left-4 top-4 z-10 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                                                                        {categoryName}
                                                                    </div>
                                                                    <img src={courseImage} alt={data.tenKhoaHoc} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                                </div>
                                                            </Link>

                                                            <div className="p-5">
                                                                <div className="mb-2 flex items-center justify-between">
                                                                    <div className="flex items-center space-x-1 text-amber-400">
                                                                        {[1, 2, 3, 4, 5].map(star => {
                                                                            const rating = parseFloat(data.averageRating || '0');
                                                                            if (rating >= star) return <i key={star} className="las la-star"></i>;
                                                                            if (rating >= star - 0.5) return <i key={star} className="las la-star-half-alt"></i>;
                                                                            return <i key={star} className="lar la-star"></i>;
                                                                        })}
                                                                        <span className="ml-1 text-sm text-gray-500">({data.averageRating || '0.0'})</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-lg font-bold text-emerald-500">{formatPrice(data.giaBan)}</span>
                                                                    </div>
                                                                </div>

                                                                <h6 className="mb-4 text-lg font-bold leading-tight text-slate-800 line-clamp-2 hover:text-emerald-500">
                                                                    <Link to={courseUrl} className="text-decoration-none hover:no-underline text-slate-800 hover:text-emerald-500">{data.tenKhoaHoc}</Link>
                                                                </h6>

                                                                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
                                                                    <div className="flex items-center space-x-2">
                                                                        <img src={instructorAvatar} alt={instructorName} className="h-8 w-8 rounded-full object-cover" onError={(e: any) => { e.target.src = defaultAvatar; }} />
                                                                        <span className="text-sm font-medium text-gray-600">{instructorName}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between text-sm font-medium text-gray-500">
                                                                    <div className="flex items-center space-x-1">
                                                                        <i className="las la-book text-emerald-500"></i>
                                                                        <span>{data.totalLessons || 0} Bài giảng</span>
                                                                    </div>
                                                                    <Link to={courseUrl} className="flex items-center text-emerald-500 hover:text-emerald-600 text-decoration-none hover:no-underline">
                                                                        Xem chi tiết <i className="las la-arrow-right ml-1"></i>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                    </SwiperComponent>
                                ) : (
                                    <div className="text-center">Chưa có khóa học nào</div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Styles>
    );
};

export default CourseSlider;
