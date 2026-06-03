import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/newsletterForm";

function NewsletterForm() {
    let data = {
        secTitle: 'Get The Latest News & Updates On Your Box',
    }

    useEffect(() => {
        const form = document.getElementById("form2") as HTMLFormElement | null;
        const name = document.getElementById("name2") as HTMLInputElement | null;
        const email = document.getElementById("email2") as HTMLInputElement | null;

        if (!form || !name || !email) {
            return;
        }

        const nameInput = name;
        const emailInput = email;

        form.addEventListener("submit", formSubmit);

        function formSubmit(e: SubmitEvent) {
            e.preventDefault();

            const nameValue = nameInput.value.trim();
            const emailValue = emailInput.value.trim();

            if (nameValue === "") {
                setError(nameInput, "Name can't be blank");
            } else {
                setSuccess(nameInput);
            }

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
            const errorMsg = formControl?.querySelector(".input-msg2") as HTMLElement | null;
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
            {/* Newsletter Form */}
            <section className="newsletter-form-area">
                <Container>
                    <Row>
                        <Col md="12">
                            <div className="newsletter-container">
                                <div className="newsletter-box">
                                    <div className="sec-title text-center">
                                        <h4>{data.secTitle}</h4>
                                    </div>
                                    <form id="form2" className="form">
                                        <Row>
                                            <Col md="4">
                                                <p className="form-control">
                                                    <input type="text" placeholder="Enter your Name" id="name2" />
                                                    <span className="input-msg2"></span>
                                                </p>
                                            </Col>
                                            <Col md="4">
                                                <p className="form-control">
                                                    <input type="email" placeholder="Enter your Email" id="email2" />
                                                    <span className="input-msg2"></span>
                                                </p>
                                            </Col>
                                            <Col md="4">
                                                <button><i className="las la-envelope"></i>Subscribe Now</button>
                                            </Col>
                                        </Row>
                                    </form>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Styles>
    );
}

export default NewsletterForm
