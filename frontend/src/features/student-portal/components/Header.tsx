import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Dropdown } from 'react-bootstrap';
import Search from './common/Search';
import Sidebar from './common/Sidebar';
import StickyMenu from './common/StickyMenu';
import MobileMenu from './common/MobileMenu';
import AuthControls from './common/AuthControls';
import { Styles } from "./styles/header";
import { CourseCategoryDropdown } from './common/CourseCategoryMenu';

class Header extends Component {
    render() {
        return (
            <Styles>
                {/* Topbar */}
                <section className="top-bar">
                    <Container>
                        <Row>
                            <Col lg="6" md="5">
                                <div className="bar-left">
                                    <ul className="list-unstyled list-inline">
                                        <li className="list-inline-item"><i className="las la-map-marker"></i>795 South Park Avenue, CA 94107.</li>
                                        <li className="list-inline-item"><Link to={"/faq"}>Câu hỏi thường gặp</Link></li>
                                    </ul>
                                </div>
                            </Col>
                            <Col lg="6" md="7">
                                <div className="bar-right d-flex justify-content-end">
                                    <ul className="list-unstyled list-inline bar-social">
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-facebook-f"></i></a></li>
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-twitter"></i></a></li>
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-linkedin-in"></i></a></li>
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-instagram"></i></a></li>
                                    </ul>
                                    <ul className="list-unstyled list-inline bar-lang">
                                        <li className="list-inline-item">
                                            <Dropdown>
                                                <Dropdown.Toggle as="a"><img src={"/assets/images/us.png"} alt="" />Tiếng Việt<i className="las la-angle-down"></i></Dropdown.Toggle>
                                                <Dropdown.Menu as="ul">
                                                    <Dropdown.Item as="li"><img src={"/assets/images/us.png"} alt="" /> Tiếng Việt</Dropdown.Item>
                                                    <Dropdown.Item as="li"><img src={"/assets/images/us.png"} alt="" /> English</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </li>
                                    </ul>
                                    <div className="nav-auth-box">
                                        {/* Removed from top bar to move to main nav */}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Logo Area */}
                <section className="logo-area">
                    <Container>
                        <Row>
                            <Col md="3">
                                <div className="logo">
                                    <Link to={"/"}><img src={"/assets/images/logo.png"} alt="" /></Link>
                                </div>
                            </Col>
                            <Col md="9">
                                <div className="logo-contact-box d-flex justify-content-end">
                                    <div className="emcontact-box d-flex">
                                        <div className="box-icon">
                                            <i className="flaticon-phone-call"></i>
                                        </div>
                                        <div className="box-content">
                                            <p>Gọi ngay</p>
                                            <span>(908) 875 7678</span>
                                        </div>
                                    </div>
                                    <div className="emcontact-box d-flex">
                                        <div className="box-icon">
                                            <i className="flaticon-envelope"></i>
                                        </div>
                                        <div className="box-content">
                                            <p>Gửi yêu cầu</p>
                                            <span>enquery@edulyn.com</span>
                                        </div>
                                    </div>
                                    <div className="nav-auth-box" style={{ marginLeft: '40px' }}>
                                        <AuthControls />
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Navbar */}
                <section className="main-menu">
                    <Container>
                        <Row>
                            <Col md="12">
                                <div className="main-menu-box">
                                    <div className="menu-box d-flex justify-content-between">
                                        <ul className="nav menu-nav">
                                            <li className="nav-item active">
                                                <Link className="nav-link" to={"/"}>Trang chủ</Link>
                                                <ul className="dropdown list-unstyled d-none">
                                                    <li className="nav-item active"><Link className="nav-link" to={"/"}>Home Style 1</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/home-two"}>Home Style 2</Link></li>
                                                </ul>
                                            </li>
                                            <li className="nav-item dropdown d-none">
                                                <Link className="nav-link dropdown-toggle" to={"/"} data-toggle="dropdown">Pages <i className="las la-angle-down"></i></Link>
                                                <ul className="dropdown list-unstyled">
                                                    <li className="nav-item"><Link className="nav-link" to={"/about"}>About Us</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/gallery"}>Gallery</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/login"}>Log In</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/registration"}>Registration</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/contact"}>Contact</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/faq"}>Faq</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/404"}>404</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/coming-soon"}>Coming Soon</Link></li>
                                                </ul>
                                            </li>
                                            <CourseCategoryDropdown />
                                            <li className="nav-item">
                                                <Link className="nav-link" to={"/instructors"}>Giảng viên</Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link className="nav-link" to={"/events"}>Sự kiện</Link>
                                            </li>
                                            <li className="nav-item dropdown">
                                                <Link className="nav-link dropdown-toggle" to={"/"} data-toggle="dropdown">Bài viết <i className="las la-angle-down"></i></Link>
                                                <ul className="dropdown list-unstyled">
                                                    <li className="nav-item"><Link className="nav-link" to={"/blog-classic"}>Blog Classic</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/blog-grid"}>Blog Grid</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/blog-details"}>Blog Details</Link></li>
                                                </ul>
                                            </li>
                                            <li className="nav-item dropdown d-none">
                                                <Link className="nav-link dropdown-toggle" to={"/"} data-toggle="dropdown">Shop <i className="las la-angle-down"></i></Link>
                                                <ul className="dropdown list-unstyled">
                                                    <li className="nav-item"><Link className="nav-link" to={"/products"}>Products</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/product-details"}>Product Details</Link></li>
                                                    <li className="nav-item"><Link className="nav-link" to={"/cart"}>Cart</Link></li>
                                                </ul>
                                            </li>
                                        </ul>
                                        <ul className="nav search-cart-bar">
                                            <li className="nav-item search-box">
                                                <Search />
                                            </li>
                                            <li className="nav-item cart-box">
                                                <Link to={"/cart"} className="nav-link nav-cart">
                                                    <i className="las la-shopping-bag"></i>
                                                </Link>
                                            </li>
                                            <li className="nav-item side-box">
                                                <Sidebar />
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Sticky Menu */}
                <StickyMenu />

                {/* Mobile Menu */}
                <MobileMenu />
            </Styles>
        )
    }
}

export default Header

