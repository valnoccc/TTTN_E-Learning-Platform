import React, { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Col, Spinner } from 'react-bootstrap';
import Pagination from './../../../components/Pagination';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../../cart/cartSlice';
import axiosClient from '../../../../../api/axios';
import toast from 'react-hot-toast';

const formatPrice = (price: any) => {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
    }).format(price || 0).replace('₫', 'đ');
};

const formatCourseDuration = (durationSeconds: any) => {
    const totalSeconds = Number(durationSeconds || 0);
    if (totalSeconds <= 0) return '0 phút';
    if (totalSeconds < 3600) return `${Math.round(totalSeconds / 60)} phút`;
    return `${(totalSeconds / 3600).toFixed(1)} giờ`;
};

const CourseItemList = ({ filters }: { filters?: any }) => {
    const dispatch = useDispatch();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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
                    // Task 3: Lấy tên giảng viên từ trường đúng trong DB (hoTen), không dùng firstName/lastName
                    const instructorName = data.giangVien?.hoTen || data.giangVien?.tenGiangVien || 'Chưa có giảng viên';
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
                    const courseDurationText = formatCourseDuration(
                        data.totalDurationSeconds ?? data.tongThoiLuong ?? data.totalDuration ?? 0,
                    );

                    return (
                        <Col md="12" key={i} className="mb-4">
                            <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg md:flex-row">
                                <div className="relative w-full md:w-1/3">
                                    <Link to={courseUrl} className="block h-full w-full">
                                        <div className="absolute left-4 top-4 z-10 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                                            {categoryName}
                                        </div>
                                        <img src={courseImage} alt={data.tenKhoaHoc} className="h-64 w-full object-cover transition-transform duration-500 hover:scale-110 md:h-full" />
                                    </Link>
                                </div>
                                <div className="flex flex-1 flex-col p-6">
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
                                            <span className="text-xl font-bold text-emerald-500">{formatPrice(data.giaBan)}</span>
                                        </div>
                                    </div>
                                    
                                    <h5 className="mb-3 text-xl font-bold leading-tight text-slate-800 hover:text-emerald-500">
                                        <Link to={courseUrl} className="text-decoration-none hover:no-underline text-slate-800 hover:text-emerald-500">{data.tenKhoaHoc}</Link>
                                    </h5>
                                    
                                    <p className="mb-4 flex-1 text-gray-600 line-clamp-2">
                                        {data.moTa || "Chưa có mô tả cho khóa học này."}
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2">
                                                <img
                                                    src={instructorAvatar}
                                                    alt={instructorName}
                                                    className="h-8 w-8 rounded-full object-cover"
                                                    onError={(e: any) => { e.target.src = defaultAvatar; }}
                                                />
                                                <span className="text-sm font-medium text-gray-600">{instructorName}</span>
                                            </div>
                                            <div className="hidden items-center space-x-1 text-sm text-gray-500 sm:flex">
                                                <i className="las la-clock text-emerald-500"></i>
                                                <span>{courseDurationText}</span>
                                            </div>
                                            <div className="hidden items-center space-x-1 text-sm text-gray-500 sm:flex">
                                                <i className="las la-signal text-emerald-500"></i>
                                                <span>Mọi cấp độ</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                className="flex items-center rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    dispatch(addToCart({
                                                        id: data.maKH,
                                                        courseName: data.tenKhoaHoc,
                                                        thumbnail: courseImage,
                                                        instructor: instructorName,
                                                        price: parseFloat(data.giaBan || '0'),
                                                        duration: courseDurationText,
                                                        level: 'Mọi cấp độ',
                                                        category: categoryName
                                                    }));
                                                    toast.success('🎉 Đã thêm khóa học vào giỏ hàng thành công!');
                                                }}
                                            >
                                                <i className="las la-shopping-cart mr-1 text-lg"></i> Thêm vào giỏ
                                            </button>
                                            <Link to={courseUrl} className="flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 hover:text-white text-decoration-none hover:no-underline">
                                                Chi tiết <i className="las la-arrow-right ml-1"></i>
                                            </Link>
                                        </div>
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

export default CourseItemList;
