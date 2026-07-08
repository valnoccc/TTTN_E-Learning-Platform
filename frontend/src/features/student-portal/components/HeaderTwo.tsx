import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Dropdown } from 'react-bootstrap';
import Search from './common/Search';
import Sidebar from './common/Sidebar';
import AuthControls from './common/AuthControls';

import MobileMenu from './common/MobileMenu';
import { Styles } from "./styles/headerTwo";
import CartIcon from '../../cart/components/CartIcon';
import { NotificationDropdown } from "./common/NotificationDropdown";
import { CourseCategoryDropdown } from './common/CourseCategoryMenu';

class HeaderTwo extends Component {
    render() {
        return (
            <Styles>
                {/* Topbar 2 */}
                <section className="top-bar2">
                    <Container>
                        <Row>
                            <Col lg="7" md="9">
                                <div className="bar-left">
                                    <ul className="list-unstyled list-inline">
                                        <li className="list-inline-item"><i className="las la-phone"></i>028 7300 8888</li>
                                        <li className="list-inline-item"><i className="las la-envelope"></i>lienhe@edumeo.vn</li>
                                        <li className="list-inline-item"><i className="las la-map-marker"></i>Tòa nhà Edumeo, Quận 1, TP.HCM
                                    </li>
                                    </ul>
                                </div>
                            </Col>
                            <Col lg="5" md="3">
                                <div className="bar-right d-flex justify-content-end">
                                    <ul className="list-unstyled list-inline bar-lang">
                                        <li className="list-inline-item">
                                            <Dropdown>
                                                <Dropdown.Toggle><img src={"/assets/images/vietnam.png"} alt="" />Tiếng Việt<i className="las la-angle-down"></i></Dropdown.Toggle>
                                                <Dropdown.Menu as="ul">
                                                    <Dropdown.Item as="li"><img src={"/assets/images/us.png"} alt="" /> Tiếng Anh</Dropdown.Item>
                                                    <Dropdown.Item as="li"><img src={"/assets/images/vietnam.png"} alt="" /> Tiếng Việt</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </li>
                                    </ul>
                                    <ul className="list-unstyled list-inline bar-social">
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-facebook-f"></i></a></li>
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-twitter"></i></a></li>
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-linkedin-in"></i></a></li>
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-instagram"></i></a></li>
                                    </ul>

                                    <ul className="list-unstyled list-inline sidebar-button">
                                        <li className="list-inline-item nav-item side-box">
                                            <Sidebar />
                                        </li>
                                    </ul>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Logo Area 2 */}
                <section className="logo-area2">
                    <Container>
                        <Row className="align-items-center">
                            <Col md="3">
                                <div className="logo">
                                    <Link to={"/"}><img src={"/assets/images/logo.png"} alt="" /></Link>
                                </div>
                            </Col>
                            <Col md="9">
                                <div className="menu-box d-flex align-items-center">
                                    <ul className="nav menu-nav justify-content-center flex-grow-1 flex-nowrap" style={{ whiteSpace: 'nowrap' }}>
                                        <li className="nav-item active">
                                            <Link className="nav-link" to={"/"}>Trang chủ</Link>
                                            <ul className="dropdown list-unstyled d-none">
                                                <li className="nav-item"><Link className="nav-link" to={"/"}>Home Style 1</Link></li>
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
                                        {/* <li className="nav-item">
                                            <Link className="nav-link" to={"/student/profile?tab=courses"}>Khóa học của tôi</Link>
                                        </li> */}
                                        <li className="nav-item">
                                            <Link className="nav-link" to={"/instructors"}>Giảng viên</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link className="nav-link" to={"/forum"}>Diễn đàn</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link className="nav-link" to={"/blog-grid"}>Bài viết</Link>
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
                                    <ul className="nav search-cart-bar d-flex align-items-center flex-nowrap" style={{ gap: '15px' }}>
                                        <li className="nav-item search-box">
                                            <Search />
                                        </li>
                                        <li className="nav-item cart-box">
                                            <CartIcon />
                                        </li>
                                        <li className="nav-item notification-box">
                                            <NotificationDropdown />
                                        </li>
                                        <li className="nav-item cart-box">
                                            <AuthControls />
                                        </li>
                                    </ul>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Sticky Menu removed in favor of native CSS position: sticky on logo-area2 */}

                {/* Mobile Menu */}
                <MobileMenu />
            </Styles>
        )
    }
}

export default HeaderTwo

