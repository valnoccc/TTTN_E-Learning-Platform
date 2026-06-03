import React, { Component, createRef } from 'react';
import { Link } from 'react-router-dom';
import { Styles } from "./styles/sidebar";

class Sidebar extends Component {
    private sidebarBodyRef = createRef<HTMLDivElement>();
    private sidebarOverlayRef = createRef<HTMLDivElement>();

    componentDidMount() {
        const sidebarBtn = document.getElementById("sidebar-btn");
        const sidebarBody = this.sidebarBodyRef.current;
        const sidebarOverlay = this.sidebarOverlayRef.current;
        const sidebarExit = document.getElementById("close-sidebar");

        if (!sidebarBtn || !sidebarBody || !sidebarOverlay || !sidebarExit) {
            return;
        }

        const openSidebar = (e: MouseEvent) => {
            e.preventDefault();
            sidebarOverlay.classList.add("visible");
            sidebarBody.classList.add("opened");
        };

        const closeSidebar = (e: MouseEvent) => {
            e.preventDefault();
            sidebarOverlay.classList.remove("visible");
            sidebarBody.classList.remove("opened");
        };

        sidebarBtn.addEventListener("click", openSidebar);
        sidebarOverlay.addEventListener("click", closeSidebar);
        sidebarExit.addEventListener("click", closeSidebar);

        (this as any).cleanup = () => {
            sidebarBtn.removeEventListener("click", openSidebar);
            sidebarOverlay.removeEventListener("click", closeSidebar);
            sidebarExit.removeEventListener("click", closeSidebar);
        };
    }

    componentWillUnmount() {
        if ((this as any).cleanup) {
            (this as any).cleanup();
        }
    }

    render() {
        return (
            <Styles>
                <a href={process.env.PUBLIC_URL + "/"} className="nav-link nav-sidebar" id="sidebar-btn">
                    <i className="las la-bars"></i>
                </a>

                <div className="sidebar" id="sidebar-body" ref={this.sidebarBodyRef}>
                    <div className="side-logo d-flex justify-content-between">
                        <div><Link to={process.env.PUBLIC_URL + "/"}><img src={process.env.PUBLIC_URL + "/assets/images/logo.png"} alt="" /></Link></div>
                        <div><a href={process.env.PUBLIC_URL + "/"} id="close-sidebar"><i className="las la-times"></i></a></div>
                    </div>
                    <div className="side-content">
                        <h5>About Us</h5>
                        <p>Lorem ipsum dolor sit amet, consecte adipisicing elit. Mollitia modi, nostru rem sapiente. Excepturi molestiae soluta quisquam officiis iure sunt.</p>
                    </div>
                    <div className="side-post">
                        <h5>Recent Post</h5>
                        <div className="post-box d-flex">
                            <div className="post-img">
                                <img src={process.env.PUBLIC_URL + "/assets/images/post-01.jpg"} alt="" />
                            </div>
                            <div className="post-title">
                                <p>Lorem ipsum dolor sit amet, consecte adipisicing elit.</p>
                                <span>March 12, 2020</span>
                            </div>
                        </div>
                        <div className="post-box d-flex">
                            <div className="post-img">
                                <img src={process.env.PUBLIC_URL + "/assets/images/post-02.jpg"} alt="" />
                            </div>
                            <div className="post-title">
                                <p>Lorem ipsum dolor sit amet, consecte adipisicing elit.</p>
                                <span>March 12, 2020</span>
                            </div>
                        </div>
                        <div className="post-box d-flex">
                            <div className="post-img">
                                <img src={process.env.PUBLIC_URL + "/assets/images/post-03.jpg"} alt="" />
                            </div>
                            <div className="post-title">
                                <p>Lorem ipsum dolor sit amet, consecte adipisicing elit.</p>
                                <span>March 12, 2020</span>
                            </div>
                        </div>
                    </div>
                    <div className="side-gallery">
                        <h5>Gallery</h5>
                        <img src={process.env.PUBLIC_URL + "/assets/images/gallery-01.jpg"} alt="" />
                        <img src={process.env.PUBLIC_URL + "/assets/images/gallery-02.jpg"} alt="" />
                        <img src={process.env.PUBLIC_URL + "/assets/images/gallery-03.jpg"} alt="" />
                        <img src={process.env.PUBLIC_URL + "/assets/images/gallery-04.jpg"} alt="" />
                        <img src={process.env.PUBLIC_URL + "/assets/images/gallery-05.jpg"} alt="" />
                        <img src={process.env.PUBLIC_URL + "/assets/images/gallery-06.jpg"} alt="" />
                    </div>
                    <div className="side-contact">
                        <h5>Contact Us</h5>
                        <ul className="list-unstyled">
                            <li><i className="las la-map-marker"></i>795 South Park Avenue, New York, NY USA 94107</li>
                            <li><i className="las la-phone"></i>+1 (396) 486 4709</li>
                            <li><i className="las la-envelope"></i>enquery@edulyb.com</li>
                        </ul>
                    </div>
                    <div className="side-social">
                        <ul className="list-unstyled list-inline">
                            <li className="list-inline-item"><a href={process.env.PUBLIC_URL + "/"}><i className="fab fa-facebook-f"></i></a></li>
                            <li className="list-inline-item"><a href={process.env.PUBLIC_URL + "/"}><i className="fab fa-twitter"></i></a></li>
                            <li className="list-inline-item"><a href={process.env.PUBLIC_URL + "/"}><i className="fab fa-google"></i></a></li>
                            <li className="list-inline-item"><a href={process.env.PUBLIC_URL + "/"}><i className="fab fa-linkedin-in"></i></a></li>
                            <li className="list-inline-item"><a href={process.env.PUBLIC_URL + "/"}><i className="fab fa-instagram"></i></a></li>
                        </ul>
                    </div>
                </div>
                <div className="sidebar-overlay" id="sidebar-overlay" ref={this.sidebarOverlayRef}></div>
            </Styles>
        );
    }
}

export default Sidebar;
