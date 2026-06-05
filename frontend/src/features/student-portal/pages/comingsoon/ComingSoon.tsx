import React, { useEffect } from 'react';
import Datas from '../../data/coming-soon/coming-soon.json';
import { Container, Row, Col } from 'react-bootstrap';
import Timer from 'react-compound-timer';
import { Styles } from './styles/comingSoon';

function ComingSoon() {
    useEffect(() => {
        const form = document.getElementById("cm_form") as HTMLFormElement | null;
        const email = document.getElementById("cm_email") as HTMLInputElement | null;

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
            const errorMsg = formControl?.querySelector(".cm_input-msg") as HTMLElement | null;
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
        <div className="site-wrap">
            <Styles>
                {/* Main Wrapper */}
                <div className="main-wrapper coming-soon-page">

                    {/* Coming Soon Area */}
                    <section className="coming-soon-area" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/${Datas.backgroundImage})` }}>
                        <div className="cm-table">
                            <div className="cm-tablecell">
                                <Container>
                                    <Row>
                                        <Col md="12" className="text-center">
                                            <div className="cm-logo">
                                                <img src={process.env.PUBLIC_URL + "/assets/images/logo.png"} alt="" />
                                            </div>
                                            <div className="launching-text">
                                                <p>We are launching soon</p>
                                            </div>
                                            <div className="countdown-timer">
                                                <Timer initialTime={1040 * 2950 * 980} direction="backward">
                                                    <p><span><Timer.Days /></span>Days</p>
                                                    <p><span><Timer.Hours /></span>Hours</p>
                                                    <p><span><Timer.Minutes /></span>Minutes</p>
                                                    <p><span><Timer.Seconds /></span>Seconds</p>
                                                </Timer>
                                            </div>
                                            <div className="email-subscrition">
                                                <p className="sub-text">Don't miss our news & updates</p>
                                                <form id="cm_form" className="form">
                                                    <p className="form-control">
                                                        <input type="email" placeholder="Enter your email" id="cm_email" />
                                                        <span className="cm_input-msg"></span>
                                                    </p>
                                                    <button>Submit</button>
                                                </form>
                                            </div>
                                            <div className="cm-social">
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
                            </div>
                        </div>

                    </section>

                </div>
            </Styles>
        </div>
    )
}

export default ComingSoon
