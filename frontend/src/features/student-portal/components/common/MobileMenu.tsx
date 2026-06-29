import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import AuthControls from './AuthControls';
import { Styles } from "./styles/mobileMenu";
import { CourseCategoryMobile } from './CourseCategoryMenu';

class MobileMenu extends Component {
    componentDidMount() {
        const hmBtn = document.getElementById("mb-sidebar-btn");
        const mdSidebarOverlay = document.getElementById("mb-sidebar-overlay");
        const mdSidebarBody = document.getElementById("mb-sidebar-body");
        const mdSidebarExit = document.getElementById("close-mb-sidebar");
        const menuButton = Array.from(document.querySelectorAll<HTMLElement>(".mb-menu-button"));

        if (hmBtn && mdSidebarOverlay && mdSidebarBody && mdSidebarExit) {
            const toggleSidebar = (e: MouseEvent) => {
                e.preventDefault();
                mdSidebarOverlay.classList.toggle("visible");
                mdSidebarBody.classList.toggle("opened");
            };

            const closeSidebar = (e: MouseEvent) => {
                e.preventDefault();
                mdSidebarOverlay.classList.remove("visible");
                mdSidebarBody.classList.remove("opened");
            };

            hmBtn.addEventListener("click", toggleSidebar);
            mdSidebarOverlay.addEventListener("click", closeSidebar);
            mdSidebarExit.addEventListener("click", closeSidebar);

            (this as any).cleanup = () => {
                hmBtn.removeEventListener("click", toggleSidebar);
                mdSidebarOverlay.removeEventListener("click", closeSidebar);
                mdSidebarExit.removeEventListener("click", closeSidebar);
            };
        }

        const menuCleanups: Array<() => void> = [];
        menuButton.forEach((button) => {
            const onClick = () => {
                button.classList.toggle("active");
                const content = button.nextElementSibling as HTMLElement | null;
                if (!content) {
                    return;
                }
                if (button.classList.contains("active")) {
                    content.className = "mb-menu-content show";
                    content.style.maxHeight = content.scrollHeight + "px";
                } else {
                    content.className = "mb-menu-content";
                    content.style.maxHeight = "0";
                }
            };
            button.addEventListener("click", onClick);
            menuCleanups.push(() => button.removeEventListener("click", onClick));
        });

        (this as any).menuCleanups = menuCleanups;
    }

    componentWillUnmount() {
        if ((this as any).cleanup) {
            (this as any).cleanup();
        }
        if ((this as any).menuCleanups) {
            (this as any).menuCleanups.forEach((fn: () => void) => fn());
        }
    }

    render() {
        return (
            <Styles>
                <section className="mobile-menu-area">
                    <Container>
                        <Row>
                            <Col md={12} sm={12}>
                                <div className="mb-topbar d-flex justify-content-between">
                                    <div className="topbar-item">
                                        <p><i className="las la-phone"></i>+1 (396) 486 4709</p>
                                    </div>
                                    <div className="topbar-item">
                                        <AuthControls />
                                    </div>
                                </div>
                                <div className="mb-logo-area d-flex justify-content-between">
                                    <div className="mb-logo-box d-flex">
                                        <div className="hm-button">
                                            <a href={"/"} id="mb-sidebar-btn">
                                                <i className="las la-bars"></i>
                                            </a>
                                        </div>
                                        <div className="mb-logo">
                                            <Link to={"/"}><img src={"/assets/images/f-logo.png"} alt="" /></Link>
                                        </div>
                                    </div>
                                    <div className="mb-search-box">
                                        <form action="#">
                                            <input type="text" name="search" placeholder="Nhập từ khóa tìm kiếm" />
                                            <button type="submit"><i className="las la-search"></i></button>
                                        </form>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="mb-sidebar" id="mb-sidebar-body">
                    <div className="mb-sidebar-heading d-flex justify-content-between">
                        <div><h5>Danh Mục</h5></div>
                        <div><a href={"/"} id="close-mb-sidebar"><i className="las la-times"></i></a></div>
                    </div>
                    <div className="mb-sidebar-menu">
                        <div className="mb-menu-item">
                            <button className="mb-menu-button active">
                                <p><Link to={"/"} style={{ color: "inherit", textDecoration: "none" }}>Trang chủ</Link></p>
                            </button>
                            <div className="mb-menu-content show d-none">
                                <ul className="list-unstyled">
                                    <li><Link to={"/"}>Home Style 1</Link></li>
                                    <li><Link to={"/home-two"}>Home Style 2</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mb-menu-item d-none">
                            <button className="mb-menu-button active">
                                <p>Pages <i className="las la-plus"></i></p>
                            </button>
                            <div className="mb-menu-content show">
                                <ul className="list-unstyled">
                                    <li><Link to={"/about"}>About Us</Link></li>
                                    <li><Link to={"/gallery"}>Gallery</Link></li>
                                    <li><Link to={"/login"}>Log In</Link></li>
                                    <li><Link to={"/registration"}>Registration</Link></li>
                                    <li><Link to={"/contact"}>Contact</Link></li>
                                    <li><Link to={"/faq"}>Faq</Link></li>
                                    <li><Link to={"/404"}>404</Link></li>
                                    <li><Link to={"/coming-soon"}>Coming Soon</Link></li>
                                </ul>
                            </div>
                        </div>
                        <CourseCategoryMobile />
                        <div className="mb-menu-item">
                            <button className="mb-menu-button active">
                                <p><Link to={"/student/profile?tab=courses"} style={{ color: "inherit", textDecoration: "none" }}>Khóa học của tôi</Link></p>
                            </button>
                        </div>
                        <div className="mb-menu-item">
                            <button className="mb-menu-button active">
                                <p><Link to={"/instructors"} style={{ color: "inherit", textDecoration: "none" }}>Giảng viên</Link></p>
                            </button>
                        </div>
                        <div className="mb-menu-item">
                            <button className="mb-menu-button active">
                                <p><Link to={"/events"} style={{ color: "inherit", textDecoration: "none" }}>Sự kiện</Link></p>
                            </button>
                        </div>
                        <div className="mb-menu-item">
                            <button className="mb-menu-button active">
                                <p><Link to={"/blog-grid"} style={{ color: "inherit", textDecoration: "none" }}>Bài viết</Link></p>
                            </button>
                        </div>
                        <div className="mb-menu-item d-none">
                            <button className="mb-menu-button">
                                <p>Shop <i className="las la-plus"></i></p>
                            </button>
                            <div className="mb-menu-content">
                                <ul className="list-unstyled">
                                    <li><Link to={"/products"}>Products</Link></li>
                                    <li><Link to={"/product-details"}>Product Details</Link></li>
                                    <li><Link to={"/cart"}>Cart</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
                <div className="mb-sidebar-overlay" id="mb-sidebar-overlay"></div>
            </Styles>
        );
    }
}

export default MobileMenu;

