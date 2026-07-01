import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Search from './Search';
import AuthControls from './AuthControls';
import { Styles } from "./styles/stickyMenu";
import { CourseCategoryDropdown } from './CourseCategoryMenu';

class StickyMenu extends Component<{}, { isSticky: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = {
            isSticky: false
        };
    }

    onScroll = () => {
        if (window.scrollY > 160) {
            if (!this.state.isSticky) {
                this.setState({ isSticky: true });
            }
        } else {
            if (this.state.isSticky) {
                this.setState({ isSticky: false });
            }
        }
    };

    componentDidMount() {
        window.addEventListener("scroll", this.onScroll);
        this.onScroll();
    }

    componentWillUnmount() {
        window.removeEventListener("scroll", this.onScroll);
    }

    render() {
        return (
            <Styles>
                <section className={`sticky-menu ${this.state.isSticky ? 'sticky' : ''}`}>
                    <Container>
                        <Row>
                            <Col md="3">
                                <div className="logo">
                                    <Link to={"/"}><img src={"/assets/images/logo.png"} alt="" /></Link>
                                </div>
                            </Col>
                            <Col md="9">
                                <div className="menu-box d-flex justify-content-end">
                                    <ul className="nav menu-nav">
                                        <li className="nav-item active">
                                            <Link className="nav-link" to={"/"}>Trang chủ</Link>
                                            <ul className="dropdown list-unstyled d-none">
                                                <li className="nav-item"><Link className="nav-link" to={"/"}>Home Style 1</Link></li>
                                                <li className="nav-item active"><Link className="nav-link" to={"/home-two"}>Home Style 2</Link></li>
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
                                            <Link className="nav-link" to={"/forum"}>Hỏi đáp</Link>
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
                                    <div className="search-box">
                                        <Search />
                                    </div>
                                    <div className="nav-auth-box" style={{ marginLeft: '20px' }}>
                                        <AuthControls />
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </Styles>
        );
    }
}

export default StickyMenu;

