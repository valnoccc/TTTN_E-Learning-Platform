import React, { Component } from 'react';
import Datas from '../data/course/slider.json';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/courseSlider";

class CourseSlider extends Component {
    render() {
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
                                <Row>
                                    {
                                        Datas.dataList.map((data, i) => (
                                            <Col md="4" sm="6" key={i}>
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
                                                                    <li className="list-inline-item"><i className="las la-star-half-alt"></i></li>
                                                                    <li className="list-inline-item">(4.5)</li>
                                                                </ul>
                                                            </div>
                                                            <div className="student">
                                                                <p><i className="las la-chair"></i>60</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                        ))
                                    }
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </Styles>
        );
    }
}

export default CourseSlider;
