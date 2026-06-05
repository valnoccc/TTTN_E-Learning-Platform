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
                setError(emailInput, "Email can't be blank");
            } else if (!isEmail(emailValue)) {
                setError(emailInput, "Not a valid email");
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
            <footer className="footer2" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/${Datas.backgroundImage})` }}>
                <Container>
                    <Row>
                        <Col md="3">
                            <div className="footer-logo-info">
                                <img src={process.env.PUBLIC_URL + "/assets/images/f-logo.png"} alt="" className="img-fluid" />
                                <p>Lorem ipsum dolor sit amet, consectet adipisicing elit. Saepe porro neque a nam null quos.</p>
                                <ul className="list-unstyled">
                                    <li><i className="las la-map-marker"></i>795 South Park Avenue, CA 94107</li>
                                    <li><i className="las la-envelope"></i>enquery@domain.com</li>
                                    <li><i className="las la-phone"></i>+1 908 875 7678</li>
                                </ul>
                            </div>
                        </Col>
                        <Col md="3">
                            <div className="f-links">
                                <h5>Useful Links</h5>
                                <ul className="list-unstyled">
                                    <li><Link to={process.env.PUBLIC_URL + "/"}><i className="las la-angle-right"></i>General Information</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/"}><i className="las la-angle-right"></i>Help Center</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/"}><i className="las la-angle-right"></i>Our Services</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/"}><i className="las la-angle-right"></i>Privacy Policy</Link></li>
                                    <li><Link to={process.env.PUBLIC_URL + "/"}><i className="las la-angle-right"></i>Online Support</Link></li>
                                </ul>
                            </div>
                        </Col>
                        <Col md="3">
                            <div className="f-post">
                                <h5>Twitter Post</h5>
                                <div className="post-box d-flex">
                                    <div className="po-icon">
                                        <i className="fab fa-twitter"></i>
                                    </div>
                                    <div className="po-content">
                                        <Link to={process.env.PUBLIC_URL + "/blog-details"}>Lorem ipsum dolor sit ...</Link>
                                        <span>Mar 30, 2019</span>
                                    </div>
                                </div>
                                <div className="post-box d-flex">
                                    <div className="po-icon">
                                        <i className="fab fa-twitter"></i>
                                    </div>
                                    <div className="po-content">
                                        <Link to={process.env.PUBLIC_URL + "/blog-details"}>Lorem ipsum dolor sit ...</Link>
                                        <span>Mar 30, 2019</span>
                                    </div>
                                </div>
                                <div className="post-box d-flex">
                                    <div className="po-icon">
                                        <i className="fab fa-twitter"></i>
                                    </div>
                                    <div className="po-content">
                                        <Link to={process.env.PUBLIC_URL + "/blog-details"}>Lorem ipsum dolor sit ...</Link>
                                        <span>Mar 30, 2019</span>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col md="3">
                            <div className="f-newsletter">
                                <h5>Newsletter</h5>
                                <p>Lorem ipsum dolor sit amet, consectet adipisicing elit.</p>

                                <form id="form4" className="form">
                                    <p className="form-control">
                                        <input type="email" placeholder="Enter email here" id="email4" />
                                        <span className="input-msg4"></span>
                                    </p>
                                    <button>Submit</button>
                                </form>
                            </div>
                        </Col>
                        <Col md="12">
                            <div className="copytext-area text-center">
                                <p>Copyright &copy; 2017 | Designed With <i className="las la-heart"></i> by <a href={process.env.PUBLIC_URL + "/"} target="_blank" rel="noopener noreferrer">SnazzyTheme</a></p>
                                <ul className="social list-unstyled list-inline">
                                    <li className="list-inline-item"><a href={process.env.PUBLIC_URL + "/"}><i className="fab fa-facebook-f"></i></a></li>
                                    <li className="list-inline-item"><a href={process.env.PUBLIC_URL + "/"}><i className="fab fa-twitter"></i></a></li>
                                    <li className="list-inline-item"><a href={process.env.PUBLIC_URL + "/"}><i className="fab fa-linkedin-in"></i></a></li>
                                    <li className="list-inline-item"><a href={process.env.PUBLIC_URL + "/"}><i className="fab fa-youtube"></i></a></li>
                                    <li className="list-inline-item"><a href={process.env.PUBLIC_URL + "/"}><i className="fab fa-dribbble"></i></a></li>
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
