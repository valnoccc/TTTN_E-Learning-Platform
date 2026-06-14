import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Swiper from 'react-id-swiper';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import { Styles } from './styles/instructor';
import axiosClient from '../../../../api/axios';

// Fix for Vite CommonJS interop with react-id-swiper
const SwiperComponent = (Swiper && typeof Swiper === 'object' && 'default' in Swiper) ? (Swiper as any).default : Swiper;

const settings = {
    slidesPerView: 3,
    loop: true,
    speed: 1000,
    autoplay: false,
    spaceBetween: 30,
    watchSlidesVisibility: true,
    pagination: {
        el: '.slider-dot.text-center',
        clickable: true
    },
    breakpoints: {
        0: { slidesPerView: 1 },
        576: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        992: { slidesPerView: 3 }
    }
};

const InstructorDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [instructor, setInstructor] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructor = async () => {
            try {
                const response = await axiosClient.get(`/public/instructors/${id}`);
                setInstructor(response);
            } catch (error) {
                console.error('Lỗi khi tải chi tiết giảng viên:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchInstructor();
        }
    }, [id]);

    const formatVND = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
        }).format(price).replace('₫', 'đ');
    };

    if (loading) {
        return (
            <Styles>
                <div className="main-wrapper instructor-details-page">
                    <BreadcrumbBox title="Chi tiết giảng viên" />
                    <section className="instructor-details-area">
                        <Container>
                            <p className="text-center mt-5">Đang tải thông tin giảng viên...</p>
                        </Container>
                    </section>
                </div>
            </Styles>
        );
    }

    if (!instructor) {
        return (
            <Styles>
                <div className="main-wrapper instructor-details-page">
                    <BreadcrumbBox title="Chi tiết giảng viên" />
                    <section className="instructor-details-area">
                        <Container>
                            <p className="text-center mt-5">Không tìm thấy thông tin giảng viên.</p>
                        </Container>
                    </section>
                </div>
            </Styles>
        );
    }

    const imgUrl = instructor.personImage?.startsWith('http') ? instructor.personImage : `/assets/images/${instructor.personImage}`;

    return (
        <Styles>
            <div className="main-wrapper instructor-details-page">
                <BreadcrumbBox title="Instructor Details" />
                <section className="instructor-details-area">
                    <Container>
                        <Row>
                            <Col md="4">
                                <div className="instructor-img">
                                    <img src={imgUrl} alt={instructor.personName} className="img-fluid" />
                                    <ul className="list-unstyled getintouch">
                                        {instructor.phone && <li><i className="las la-phone"></i> {instructor.phone}</li>}
                                        {instructor.email && <li><i className="lar la-envelope"></i> {instructor.email}</li>}
                                    </ul>
                                    <ul className="social list-unstyled list-inline">
                                        {instructor.socialLinks?.facebook && <li className="list-inline-item"><a href={instructor.socialLinks.facebook} target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f"></i></a></li>}
                                        {instructor.socialLinks?.instagram && <li className="list-inline-item"><a href={instructor.socialLinks.instagram} target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a></li>}
                                        {instructor.socialLinks?.github && <li className="list-inline-item"><a href={instructor.socialLinks.github} target="_blank" rel="noopener noreferrer"><i className="fab fa-github"></i></a></li>}
                                        {instructor.socialLinks?.website && <li className="list-inline-item"><a href={instructor.socialLinks.website} target="_blank" rel="noopener noreferrer"><i className="las la-globe"></i></a></li>}
                                    </ul>
                                </div>
                            </Col>
                            <Col md="8">
                                <div className="instructor-content">
                                    <h4>{instructor.personName}</h4>
                                    <span>{instructor.personTitle}</span>
                                    <p>{instructor.bio}</p>
                                </div>
                                <div className="qual-expe d-flex">
                                    <div className="qualification">
                                        <h5>Bằng cấp</h5>
                                        <div className="qual-expe-box">
                                            <h6>Chuyên môn</h6>
                                            <p>{instructor.personTitle}</p>
                                        </div>
                                    </div>
                                    <div className="experiance">
                                        <h5>Kinh nghiệm</h5>
                                        <div className="qual-expe-box">
                                            <h6>Giảng dạy tại EDUMEO</h6>
                                            <p>2023 - Present</p>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col md="12">
                                <div className="instructor-course-title">
                                    <h5>Khóa học của {instructor.personName}</h5>
                                </div>
                                <div className="instructor-course-slider">
                                    {instructor.courses && instructor.courses.length > 0 ? (
                                        <SwiperComponent {...settings}>
                                            {instructor.courses.map((course: any, i: number) => {
                                                const courseImg = course.imgUrl?.startsWith('http') ? course.imgUrl : `/assets/images/${course.imgUrl}`;
                                                return (
                                                    <div className="course-item" key={course.id || i}>
                                                        <Link to={`/course-details/${course.id}`}>
                                                            <div className="course-image" style={{ backgroundImage: `url(${courseImg})` }}>
                                                                <div className="author-img d-flex">
                                                                    <div className="img">
                                                                        <img src={imgUrl} alt="" />
                                                                    </div>
                                                                    <div className="title">
                                                                        <p>{instructor.personName}</p>
                                                                        <span>{instructor.courses.length} khóa học</span>
                                                                    </div>
                                                                </div>
                                                                <div className="course-price">
                                                                    <p>{formatVND(course.price)}</p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                        <div className="course-content">
                                                            <h6 className="heading"><Link to={`/course-details/${course.id}`}>{course.courseTitle}</Link></h6>
                                                            <p className="desc">{course.courseDesc?.substring(0, 50)}...</p>
                                                            <div className="course-face d-flex justify-content-between">
                                                                <div className="duration">
                                                                    <p><i className="las la-clock"></i>120</p>
                                                                </div>
                                                                <div className="rating">
                                                                    <ul className="list-unstyled list-inline">
                                                                        <li className="list-inline-item"><i className="las la-star"></i></li>
                                                                        <li className="list-inline-item"><i className="las la-star"></i></li>
                                                                        <li className="list-inline-item"><i className="las la-star"></i></li>
                                                                        <li className="list-inline-item"><i className="las la-star"></i></li>
                                                                        <li className="list-inline-item"><i className="las la-star-half-alt"></i></li>
                                                                        <li className="list-inline-item">(4.5)</li>
                                                                    </ul>
                                                                </div>
                                                                <div className="student">
                                                                    <p><i className="las la-eye"></i>{course.views || 0}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </SwiperComponent>
                                    ) : (
                                        <p>Giảng viên này chưa có khóa học nào.</p>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </div>
        </Styles>
    );
};

export default InstructorDetails;
