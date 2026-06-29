import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Styles } from '../styles/popularCourse';
import axiosClient from '../../../../../api/axios';

const formatPrice = (price: any) => {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
    }).format(price || 0).replace('₫', 'đ');
};

const PopularCourse = () => {
    const [courses, setCourses] = useState<any[]>([]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response: any = await axiosClient.get('/public/courses');
                if (response && response.data) {
                    setCourses(response.data.slice(0, 4));
                }
            } catch (error) {
                console.error("Error fetching popular courses", error);
            }
        };
        fetchCourses();
    }, []);

    return (
        <Styles>
            {/* Popular Course */}
            <div className="popular-course">
                <h5>Khóa học phổ biến</h5>
                <div className="popular-items">
                    {
                        courses.map((data: any, i: number) => {
                            const rawImage = data.hinhThuNho;
                            const courseImage = rawImage ? (rawImage.startsWith('http') ? rawImage : process.env.PUBLIC_URL + '/assets/images/' + rawImage) : process.env.PUBLIC_URL + '/assets/images/course-1.jpg';
                            const courseUrl = process.env.PUBLIC_URL + `/course-details/${data.maKH}`;
                            return (
                                <div className="item-box d-flex" key={i}>
                                    <div className="item-img">
                                        <Link to={courseUrl}>
                                            <img src={courseImage} alt={data.tenKhoaHoc} style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                        </Link>
                                    </div>
                                    <div className="item-content">
                                        <p className="title"><Link to={courseUrl} className="line-clamp-2">{data.tenKhoaHoc}</Link></p>
                                        <ul className="list-unstyled list-inline rating">
                                            {[...Array(5)].map((_, index) => {
                                                const rating = Math.round(parseFloat(data.averageRating || data.rating || '0'));
                                                return (
                                                    <li className="list-inline-item" key={index}>
                                                        <i className={index < rating ? "las la-star" : "lar la-star"}></i>
                                                    </li>
                                                );
                                            })}
                                            {parseFloat(data.averageRating || data.rating || '0') > 0 && (
                                                <li className="list-inline-item ms-1 text-muted" style={{fontSize: '12px'}}>
                                                    ({parseFloat(data.averageRating || data.rating || '0').toFixed(1)})
                                                </li>
                                            )}
                                        </ul>
                                        <p className="price" style={{ color: '#10b981', fontWeight: 'bold' }}>{formatPrice(data.giaBan)}</p>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </Styles>
    );
};

export default PopularCourse;
