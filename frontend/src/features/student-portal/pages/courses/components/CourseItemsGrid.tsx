// Force reload to pick up json changes
import React, { useState, Fragment } from 'react';
import Datas from '../../../data/course/item.json';
import { Link } from 'react-router-dom';
import { Col } from 'react-bootstrap';
import Pagination from './../../../components/Pagination';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../../cart/cartSlice';

const CourseItemGrid = () => {
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // Đã trả lại 6 khóa học 1 trang như ban đầu
    
    const totalPages = Math.ceil(Datas.length / itemsPerPage);
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Datas.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <Fragment>
            {/* Course Item */}
            {
                currentItems.map((data, i) => (
                    <Col lg="6" md="12" key={i}>
                        <div className="course-item">
                            <Link to={process.env.PUBLIC_URL + data.courseLink}>
                                <div className="course-image" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/${data.imgUrl})` }}>
                                    <div className="author-img d-flex">
                                        <div className="img">
                                            <img src={process.env.PUBLIC_URL + `/assets/images/${data.authorImg}`} alt="" />
                                        </div>
                                        <div className="title">
                                            <p>{data.authorName}</p>
                                            <span>{data.authorCourses}</span>
                                        </div>
                                    </div>
                                    <div className="course-price">
                                        <p>{data.price}</p>
                                    </div>
                                </div>
                            </Link>
                            <div className="course-content">
                                <h6 className="heading"><Link to={process.env.PUBLIC_URL + data.courseLink}>{data.courseTitle}</Link></h6>
                                <p className="desc">{data.courseDesc}</p>
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
                                            <li className="list-inline-item"><i className="las la-star-half-alt"></i>
                                            </li>
                                            <li className="list-inline-item">(4.5)</li>
                                        </ul>
                                    </div>
                                    <div className="student">
                                        <p><i className="las la-chair"></i>60</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <button 
                                        type="button" 
                                        className="btn w-100" 
                                        style={{ backgroundColor: '#10b981', color: '#fff', fontWeight: '500' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            dispatch(addToCart({
                                                id: parseInt(data.id || Math.floor(Math.random() * 1000).toString(), 10),
                                                courseName: data.courseTitle,
                                                thumbnail: `/assets/images/${data.imgUrl}`,
                                                instructor: data.authorName,
                                                price: parseFloat(data.price.replace('$', '')),
                                                duration: '120 Min',
                                                level: 'All Levels',
                                                category: 'General'
                                            }));
                                        }}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Col>
                ))
            }

            <Col md="12" className="text-center">
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </Col>
        </Fragment>
    );
};

export default CourseItemGrid;
