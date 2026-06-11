// Force reload to pick up json changes
import React, { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Col, Spinner } from 'react-bootstrap';
import Pagination from './../../../components/Pagination';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../../../cart/cartSlice';
import { toggleWishlist } from '../../../../wishlist/wishlistSlice';
import { RootState } from '../../../../../store/store';
import toast from 'react-hot-toast';
import axiosClient from '../../../../../api/axios';

const formatPrice = (price: any) => {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
    }).format(price || 0);
};

const CourseItemGrid = ({ filters }: { filters?: any }) => {
    const dispatch = useDispatch();
    const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filters?.search) params.append('search', filters.search);
                if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
                if (filters?.price) params.append('price', filters.price);

                const response: any = await axiosClient.get(`/public/courses?${params.toString()}`);
                if (response && response.data) {
                    setCourses(response.data);
                }
            } catch (error) {
                console.error("Error fetching courses", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [filters]);

    const totalPages = Math.ceil(courses.length / itemsPerPage);
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = courses.slice(indexOfFirstItem, indexOfLastItem);

    if (loading) {
        return (
            <Col md="12" className="text-center py-5">
                <Spinner animation="border" variant="success" />
            </Col>
        );
    }

    if (courses.length === 0) {
        return (
            <Col md="12" className="text-center py-5">
                <p>Chưa có khóa học nào</p>
            </Col>
        );
    }

    return (
        <Fragment>
            {
                currentItems.map((data: any, i: number) => {
                    const instructorName = data.giangVien ? `${data.giangVien.firstName || ''} ${data.giangVien.lastName || ''}`.trim() : 'Giảng viên chưa rõ';
                    const categoryName = data.danhMuc?.tenDM || 'General';
                    const courseImage = data.hinhThuNho || process.env.PUBLIC_URL + '/assets/images/course-1.jpg';
                    const courseUrl = process.env.PUBLIC_URL + `/course-details/${data.maKH}`;

                    return (
                        <Col lg="6" md="12" key={i} className="mb-4">
                            <div className="group relative w-full rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-xl">
                                
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
                                                    dispatch(toggleWishlist({
                                                        id: data.maKH,
                                                        courseName: data.tenKhoaHoc,
                                                        thumbnail: courseImage,
                                                        instructor: instructorName,
                                                        price: parseFloat(data.giaBan || '0'),
                                                        duration: '120 Phút',
                                                        level: 'Mọi cấp độ',
                                                        category: categoryName
                                                    }));
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
                                            <i className="las la-star"></i>
                                            <i className="las la-star"></i>
                                            <i className="las la-star"></i>
                                            <i className="las la-star"></i>
                                            <i className="las la-star-half-alt"></i>
                                            <span className="ml-1 text-sm text-gray-500">(4.5)</span>
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
                                            <img src={process.env.PUBLIC_URL + '/assets/images/author.jpg'} alt={instructorName} className="h-8 w-8 rounded-full object-cover" />
                                            <span className="text-sm font-medium text-gray-600">{instructorName}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm font-medium text-gray-500">
                                        <div className="flex items-center space-x-1">
                                            <i className="las la-book text-emerald-500"></i>
                                            <span>11 Bài giảng</span>
                                        </div>
                                        <Link to={courseUrl} className="flex items-center text-emerald-500 hover:text-emerald-600 text-decoration-none hover:no-underline">
                                            Xem chi tiết <i className="las la-arrow-right ml-1"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    );
                })
            }

            {totalPages > 1 && (
                <Col md="12" className="text-center mt-4">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </Col>
            )}
        </Fragment>
    );
};

export default CourseItemGrid;
