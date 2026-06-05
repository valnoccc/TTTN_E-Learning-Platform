import React, { Component } from 'react';
import Datas from '../data/about-us/about-us.json';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/aboutUs";

class AboutUs extends Component {
    render() {
        return (
            <Styles>
                {/* About Us */}
                <section className="about-us">
                    <Container>
                        <Row>
                            <Col md="6">
                                <div className="about-image">
                                    <img src={process.env.PUBLIC_URL + `/assets/images/${Datas.mainImage}`} className="main-img" alt="" />
                                    <img src={process.env.PUBLIC_URL + "/assets/images/pattern.png"} className="pattern-img" alt="" />
                                    <div className="video-player" style={{backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/${Datas.videoBackground})`}}>
                                        <a
                                            href="https://www.youtube.com/watch?v=uXFUl0KcIkA"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="play-button"
                                        >
                                            <i className="las la-play"></i>
                                        </a>
                                    </div>
                                </div>
                            </Col>
                            <Col md="6">
                                <div className="about-content">
                                    <h4 className="about-title">{Datas.title}</h4>
                                    <p className="about-para">{Datas.desc1}<span>{Datas.desc2}</span></p>
                                    <Row>
                                        <Col sm="4">
                                            <div className="counter-box box1 text-center">
                                                <h3>970<i className="las la-plus"></i></h3>
                                                <p>Happy Students</p>
                                            </div>
                                        </Col>
                                        <Col sm="4">
                                            <div className="counter-box box2 text-center">
                                                <h3>130<i className="las la-plus"></i></h3>
                                                <p>Teachers</p>
                                            </div>
                                        </Col>
                                        <Col sm="4">
                                            <div className="counter-box box3 text-center">
                                                <h3>340<i className="las la-plus"></i></h3>
                                                <p>Courses</p>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Link className="readmore-btn" to={process.env.PUBLIC_URL + "/about"}>Read More</Link>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </Styles>
        )
    }
}

export default AboutUs
