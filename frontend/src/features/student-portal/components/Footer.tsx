import React, { Component } from 'react';
import Datas from '../data/footer/footer.json';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import BackToTop from './common/BackToTop';
import { Styles } from "./styles/footerOne";

class Footer extends Component {
    render() {
        return (
            <Styles>
                {/* Footer Area */}
                <footer className="footer1" style={{ backgroundImage: `url(assets/images/${Datas.backgroundImage})` }}>
                    <Container>
                        <Row>
                            <Col md="4">
                                <div className="footer-logo-info">
                                    <img src={"/assets/images/f-logo.png"} alt="" className="img-fluid" />
                                    <p>EDUMEO tự hào mang đến môi trường học trực tuyến chất lượng, kết nối người học và giảng viên ở mọi nơi.</p>
                                    <ul className="list-unstyled">
                                        <li><i className="las la-map-marker"></i>123 Đường Sư Vạn Hạnh, Quận 10, TP.HCM</li>
                                        <li><i className="las la-envelope"></i>hotro@edumeo.vn</li>
                                        <li><i className="las la-phone"></i>+84 123 456 789</li>
                                    </ul>
                                </div>
                            </Col>
                            <Col md="4">
                                <div className="f-links">
                                    <h5>Liên kết hữu ích</h5>
                                    <ul className="list-unstyled">
                                        <li><Link to={"/"}><i className="las la-angle-right"></i>Thông tin chung</Link></li>
                                        <li><Link to={"/"}><i className="las la-angle-right"></i>Trung tâm hỗ trợ</Link></li>
                                        <li><Link to={"/"}><i className="las la-angle-right"></i>Dịch vụ</Link></li>
                                        <li><Link to={"/"}><i className="las la-angle-right"></i>Bảo mật & Điều khoản</Link></li>
                                        <li><Link to={"/"}><i className="las la-angle-right"></i>Hỗ trợ trực tuyến</Link></li>
                                    </ul>
                                    <ul className="list-unstyled">
                                        <li><Link to={"/"}><i className="las la-angle-right"></i>Về chúng tôi</Link></li>
                                        <li><Link to={"/"}><i className="las la-angle-right"></i>Khóa học</Link></li>
                                        <li><Link to={"/"}><i className="las la-angle-right"></i>Giảng viên</Link></li>
                                        <li><Link to={"/"}><i className="las la-angle-right"></i>Tuyển dụng</Link></li>
                                        <li><Link to={"/"}><i className="las la-angle-right"></i>Liên hệ</Link></li>
                                    </ul>
                                </div>
                            </Col>
                            <Col md="4">
                                <div className="f-post">
                                    <h5>Bài viết mới nhất</h5>
                                    <div className="post-box d-flex">
                                        <div className="post-img">
                                            <img src={"/assets/images/blog-2.jpg"} alt="" />
                                        </div>
                                        <div className="post-content">
                                            <Link to={ +"/blog-details"}>Các xu hướng E-Learning bùng nổ trong năm tới...</Link>
                                            <span>30 Th03, 2024</span>
                                        </div>
                                    </div>
                                    <div className="post-box d-flex">
                                        <div className="post-img">
                                            <img src={"/assets/images/blog-3.jpg"} alt="" />
                                        </div>
                                        <div className="post-content">
                                            <Link to={ +"/blog-details"}>Phương pháp tự học lập trình hiệu quả tại nhà...</Link>
                                            <span>15 Th04, 2024</span>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </footer>

                {/* Copyright Area */}
                <section className="copyright-area">
                    <Container>
                        <Row>
                            <Col md="6">
                                <div className="copy-text">
                                    <p>Bản quyền &copy; {new Date().getFullYear()} | Phát triển bởi <i className="las la-heart text-danger"></i> <a href={"/"} target="_blank" rel="noopener noreferrer">EDUMEO Team</a></p>
                                </div>
                            </Col>
                            <Col md="6" className="text-right">
                                <ul className="social list-unstyled list-inline">
                                    <li className="list-inline-item"><a href={"/"}><i className="fab fa-facebook-f"></i></a></li>
                                    <li className="list-inline-item"><a href={"/"}><i className="fab fa-twitter"></i></a></li>
                                    <li className="list-inline-item"><a href={"/"}><i className="fab fa-linkedin-in"></i></a></li>
                                    <li className="list-inline-item"><a href={"/"}><i className="fab fa-youtube"></i></a></li>
                                    <li className="list-inline-item"><a href={"/"}><i className="fab fa-dribbble"></i></a></li>
                                </ul>
                            </Col>
                        </Row>
                    </Container>

                    {/* Back To Top */}
                    <BackToTop/>
                </section>
            </Styles>
        )
    }
}

export default Footer

