import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import AuthControls from './AuthControls';
import { Styles } from "./styles/mobileMenu";

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
                                            <a href={process.env.PUBLIC_URL + "/"} id="mb-sidebar-btn">
                                                <i className="las la-bars"></i>
                                            </a>
                                        </div>
                                        <div className="mb-logo">
                                            <Link to={process.env.PUBLIC_URL + "/"}><img src={process.env.PUBLIC_URL + "/assets/images/f-logo.png"} alt="" /></Link>
                                        </div>
                                    </div>
                                    <div className="mb-search-box">
                                        <form action="#">
                                            <input type="text" name="search" placeholder="Search Here" />
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
                        <div><h5>Menu</h5></div>
                        <div><a href={process.env.PUBLIC_URL + "/"} id="close-mb-sidebar"><i className="las la-times"></i></a></div>
                    </div>
                    <div className="mb-sidebar-menu">
                        <div className="mb-menu-item">
                            <button className="mb-menu-button active">
                                <p>Home <i className="las la-plus"></i></p>
                            </button>
                            <div className="mb-menu-content show">
                                <ul className="list-unstyled">
                                    <li><Link to={process.env.PUBLIC_URL + "/"}>Home Style 1</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/home-two"}>Home Style 2</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mb-menu-item">
                            <button className="mb-menu-button active">
                                <p>Pages <i className="las la-plus"></i></p>
                            </button>
                            <div className="mb-menu-content show">
                                <ul className="list-unstyled">
                                    <li><Link to={process.env.PUBLIC_URL + "/about"}>About Us</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/gallery"}>Gallery</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/login"}>Log In</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/registration"}>Registration</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/contact"}>Contact</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/faq"}>Faq</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/404"}>404</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/coming-soon"}>Coming Soon</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mb-menu-item">
                            <button className="mb-menu-button active">
                                <p>Courses <i className="las la-plus"></i></p>
                            </button>
                            <div className="mb-menu-content show">
                                <ul className="list-unstyled">
                                    <li><Link to={process.env.PUBLIC_URL + "/course-grid"}>Course Grid</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/course-list"}>Course List</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/course-details"}>Course Details</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mb-menu-item">
                            <button className="mb-menu-button">
                                <p>Instructor <i className="las la-plus"></i></p>
                            </button>
                            <div className="mb-menu-content">
                                <ul className="list-unstyled">
                                    <li><Link to={process.env.PUBLIC_URL + "/instructor"}>Instructors</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/instructor-details"}>Instructor Details</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mb-menu-item">
                            <button className="mb-menu-button">
                                <p>Event <i className="las la-plus"></i></p>
                            </button>
                            <div className="mb-menu-content">
                                <ul className="list-unstyled">
                                    <li><Link to={process.env.PUBLIC_URL + "/events"}>Events</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/event-details"}>Event Details</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mb-menu-item">
                            <button className="mb-menu-button">
                                <p>Blog <i className="las la-plus"></i></p>
                            </button>
                            <div className="mb-menu-content">
                                <ul className="list-unstyled">
                                    <li><Link to={process.env.PUBLIC_URL + "/blog-classic"}>Blog Classic</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/blog-grid"}>Blog Grid</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/blog-details"}>Blog Details</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mb-menu-item">
                            <button className="mb-menu-button">
                                <p>Shop <i className="las la-plus"></i></p>
                            </button>
                            <div className="mb-menu-content">
                                <ul className="list-unstyled">
                                    <li><Link to={process.env.PUBLIC_URL + "/products"}>Products</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/product-details"}>Product Details</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/cart"}>Cart</Link></li>
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
