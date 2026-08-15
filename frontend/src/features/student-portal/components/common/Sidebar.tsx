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
                <a href={"/"} className="nav-link nav-sidebar" id="sidebar-btn">
                    <i className="las la-bars"></i>
                </a>

                <div className="sidebar" id="sidebar-body" ref={this.sidebarBodyRef}>
                    <div className="side-logo d-flex justify-content-between">
                        <div><Link to={"/"}><img src={"/assets/images/logo.png"} alt="" /></Link></div>
                        <div><a href={"/"} id="close-sidebar"><i className="las la-times"></i></a></div>
                    </div>
                    <div className="side-content">
                        <h5>Về EDUMEO</h5>
                        <p>Nền tảng học tập trực tuyến hàng đầu, mang đến cho bạn những khóa học chất lượng cao từ các chuyên gia trong ngành. Học mọi lúc, mọi nơi và làm chủ tương lai của bạn.</p>
                    </div>
                    <div className="side-post">
                        <h5>Khóa Học Mới Nhất</h5>
                        <div className="post-box d-flex">
                            <div className="post-img">
                                <img src={"/assets/images/post-01.jpg"} alt="" />
                            </div>
                            <div className="post-title">
                                <p>Lập trình Frontend thực chiến với ReactJS</p>
                                <span>15 Tháng 8, 2026</span>
                            </div>
                        </div>
                        <div className="post-box d-flex">
                            <div className="post-img">
                                <img src={"/assets/images/post-02.jpg"} alt="" />
                            </div>
                            <div className="post-title">
                                <p>Làm chủ Backend với Node.js và NestJS</p>
                                <span>10 Tháng 8, 2026</span>
                            </div>
                        </div>
                        <div className="post-box d-flex">
                            <div className="post-img">
                                <img src={"/assets/images/post-03.jpg"} alt="" />
                            </div>
                            <div className="post-title">
                                <p>Khóa học AI và Machine Learning cơ bản</p>
                                <span>01 Tháng 8, 2026</span>
                            </div>
                        </div>
                    </div>
                    <div className="side-gallery">
                        <h5>Thư Viện</h5>
                        <div className="gallery-grid">
                            <img src={"/assets/images/gallery-01.jpg"} alt="" />
                            <img src={"/assets/images/gallery-02.jpg"} alt="" />
                            <img src={"/assets/images/gallery-03.jpg"} alt="" />
                            <img src={"/assets/images/gallery-04.jpg"} alt="" />
                            <img src={"/assets/images/gallery-05.jpg"} alt="" />
                            <img src={"/assets/images/gallery-06.jpg"} alt="" />
                        </div>
                    </div>
                    <div className="side-contact">
                        <h5>Liên Hệ</h5>
                        <ul className="list-unstyled">
                            <li><i className="las la-map-marker"></i>Tòa nhà Edumeo, Quận 1, TP.HCM</li>
                            <li><i className="las la-phone"></i>028 7300 8888</li>
                            <li><i className="las la-envelope"></i>lienhe@edumeo.vn</li>
                        </ul>
                    </div>
                    <div className="side-social">
                        <ul className="list-unstyled list-inline">
                            <li className="list-inline-item"><a href={"/"}><i className="fab fa-facebook-f"></i></a></li>
                            <li className="list-inline-item"><a href={"/"}><i className="fab fa-twitter"></i></a></li>
                            <li className="list-inline-item"><a href={"/"}><i className="fab fa-google"></i></a></li>
                            <li className="list-inline-item"><a href={"/"}><i className="fab fa-linkedin-in"></i></a></li>
                            <li className="list-inline-item"><a href={"/"}><i className="fab fa-instagram"></i></a></li>
                        </ul>
                    </div>
                </div>
                <div className="sidebar-overlay" id="sidebar-overlay" ref={this.sidebarOverlayRef}></div>
            </Styles>
        );
    }
}

export default Sidebar;

