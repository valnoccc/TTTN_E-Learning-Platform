import React, { useEffect } from 'react';
import Datas from '../data/footer/footer2.json';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import BackToTop from './common/BackToTop';
import { Styles } from "./styles/footerTwo";

function FooterTwo() {
    useEffect(() => {
        const form = document.getElementById("form4") as HTMLFormElement | null;
        const email = document.getElementById("email4") as HTMLInputElement | null;

        if (!form || !email) {
            return;
        }

        const emailInput = email;

        form.addEventListener("submit", formSubmit);

        function formSubmit(e: SubmitEvent) {
            e.preventDefault();

            const emailValue = emailInput.value.trim();

            if (emailValue === "") {
                setError(emailInput, "Email không được để trống");
            } else if (!isEmail(emailValue)) {
                setError(emailInput, "Email không hợp lệ");
            } else {
                setSuccess(emailInput);
            }
        }

        function setError(input: HTMLInputElement, message: string) {
            const formControl = input.parentElement as HTMLElement | null;
            const errorMsg = formControl?.querySelector(".input-msg4") as HTMLElement | null;
            if (!formControl || !errorMsg) {
                return;
            }
            formControl.className = "form-control error";
            errorMsg.innerText = message;
        }

        function setSuccess(input: HTMLInputElement) {
            const formControl = input.parentElement as HTMLElement | null;
            if (!formControl) {
                return;
            }
            formControl.className = "form-control success";
        }

        function isEmail(email: string) {
            return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email);
        }
    }, []);

    return (
        <Styles>
            {/* Footer Two */}
            <footer className="footer2" style={{ backgroundImage: `url(/assets/images/${Datas.backgroundImage})` }}>
                <Container>
                    <Row>
                        <Col md="3">
                            <div className="footer-logo-info">
                                <img src={"/assets/images/logo.png"} alt="" className="img-fluid" style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', marginBottom: '20px' }} />
                                <p>Chúng tôi cung cấp các khóa học chất lượng cao giúp bạn nâng cao kỹ năng và phát triển sự nghiệp.</p>
                                <ul className="list-unstyled">
                                    <li><i className="las la-map-marker"></i>795 South Park Avenue, CA 94107</li>
                                    <li><i className="las la-envelope"></i>enquery@domain.com</li>
                                    <li><i className="las la-phone"></i>+1 908 875 7678</li>
                                </ul>
                            </div>
                        </Col>
                        <Col md="3">
                            <div className="f-links">
                                <h5>Liên Kết Hữu Ích</h5>
                                <ul className="list-unstyled">
                                    <li><Link to={"/"}><i className="las la-angle-right"></i>Thông Tin Chung</Link></li>
                                    <li><Link to={"/"}><i className="las la-angle-right"></i>Trung Tâm Hỗ Trợ</Link></li>
                                    <li><Link to={"/"}><i className="las la-angle-right"></i>Dịch Vụ Của Chúng Tôi</Link></li>
                                    <li><Link to={"/"}><i className="las la-angle-right"></i>Chính Sách Bảo Mật</Link></li>
                                    <li><Link to={"/"}><i className="las la-angle-right"></i>Hỗ Trợ Trực Tuyến</Link></li>
                                </ul>
                            </div>
                        </Col>
                        <Col md="3">
                            <div className="f-post">
                                <h5>Bài Viết Nổi Bật</h5>
                                <div className="post-box d-flex">
                                    <div className="po-icon">
                                        <i className="fab fa-twitter"></i>
                                    </div>
                                    <div className="po-content">
                                        <Link to={"/blog-details"}>Khám phá xu hướng công nghệ mới...</Link>
                                        <span>30 Th03, 2019</span>
                                    </div>
                                </div>
                                <div className="post-box d-flex">
                                    <div className="po-icon">
                                        <i className="fab fa-twitter"></i>
                                    </div>
                                    <div className="po-content">
                                        <Link to={"/blog-details"}>Hướng dẫn học lập trình hiệu quả...</Link>
                                        <span>30 Th03, 2019</span>
                                    </div>
                                </div>
                                <div className="post-box d-flex">
                                    <div className="po-icon">
                                        <i className="fab fa-twitter"></i>
                                    </div>
                                    <div className="po-content">
                                        <Link to={"/blog-details"}>Bí quyết xây dựng sự nghiệp thành công...</Link>
                                        <span>30 Th03, 2019</span>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col md="3">
                            <div className="f-newsletter">
                                <h5>Đăng Ký Nhận Tin</h5>
                                <p>Đăng ký nhận bản tin của chúng tôi để nhận các ưu đãi và khóa học mới nhất.</p>

                                <form id="form4" className="form">
                                    <p className="form-control">
                                        <input type="email" placeholder="Nhập email của bạn" id="email4" />
                                        <span className="input-msg4"></span>
                                    </p>
                                    <button>Gửi</button>
                                </form>
                            </div>
                        </Col>
                        <Col md="12">
                            <div className="copytext-area text-center">
                                <p>Copyright &copy; 2017 | Designed With <i className="las la-heart"></i> by <a href={"/"} target="_blank" rel="noopener noreferrer">SnazzyTheme</a></p>
                                <ul className="social list-unstyled list-inline">
                                    <li className="list-inline-item"><a href={"/"}><i className="fab fa-facebook-f"></i></a></li>
                                    <li className="list-inline-item"><a href={"/"}><i className="fab fa-twitter"></i></a></li>
                                    <li className="list-inline-item"><a href={"/"}><i className="fab fa-linkedin-in"></i></a></li>
                                    <li className="list-inline-item"><a href={"/"}><i className="fab fa-youtube"></i></a></li>
                                    <li className="list-inline-item"><a href={"/"}><i className="fab fa-dribbble"></i></a></li>
                                </ul>
                            </div>
                        </Col>
                    </Row>
                </Container>

                {/* Back To Top  */}
                <BackToTop />
            </footer>
        </Styles>
    );
}

export default FooterTwo

