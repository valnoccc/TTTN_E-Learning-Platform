import React, { useEffect } from 'react';
import Datas from '../data/help-area/help-area.json';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/homeContact";

function HelpArea() {
    useEffect(() => {
        const form = document.getElementById("form1") as HTMLFormElement | null;
        const name = document.getElementById("name1") as HTMLInputElement | null;
        const email = document.getElementById("email1") as HTMLInputElement | null;
        const subject = document.getElementById("subject1") as HTMLInputElement | null;

        if (!form || !name || !email || !subject) {
            return;
        }

        const nameInput = name;
        const emailInput = email;
        const subjectInput = subject;

        form.addEventListener("submit", formSubmit);

        function formSubmit(e: SubmitEvent) {
            e.preventDefault();

            const nameValue = nameInput.value.trim();
            const emailValue = emailInput.value.trim();
            const subjectValue = subjectInput.value.trim();

            if (nameValue === "") {
                setError(nameInput, "Tên không được để trống");
            } else {
                setSuccess(nameInput);
            }

            if (emailValue === "") {
                setError(emailInput, "Email không được để trống");
            } else if (!isEmail(emailValue)) {
                setError(emailInput, "Email không hợp lệ");
            } else {
                setSuccess(emailInput);
            }

            if (subjectValue === "") {
                setError(subjectInput, "Tiêu đề không được để trống");
            } else {
                setSuccess(subjectInput);
            }
        }

        function setError(input: HTMLInputElement, message: string) {
            const formControl = input.parentElement as HTMLElement | null;
            const errorMsg = formControl?.querySelector(".input-msg1") as HTMLElement | null;
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
            {/* Help Area */}
            <section className="home-contact-area" style={{ backgroundImage: `url(/assets/images/${Datas.backgroundImage})` }}>
                <Container>
                    <Row>
                        <Col md="12">
                            <div className="sec-title text-center">
                                <h4>{Datas.secTitle}</h4>
                            </div>
                        </Col>
                        <Col md="12">
                            <form id="form1" className="form">
                                <Row>
                                    <Col md="4">
                                        <p className="form-control">
                                            <input type="text" placeholder="Nhập Tên của bạn" id="name1" />
                                            <span className="input-msg1"></span>
                                        </p>
                                    </Col>
                                    <Col md="4">
                                        <p className="form-control">
                                            <input type="email" placeholder="Nhập Email của bạn" id="email1" />
                                            <span className="input-msg1"></span>
                                        </p>
                                    </Col>
                                    <Col md="4">
                                        <p className="form-control">
                                            <input type="text" placeholder="Nhập Tiêu đề" id="subject1" />
                                            <span className="input-msg1"></span>
                                        </p>
                                    </Col>
                                    <Col md="12" className="text-center">
                                        <button>Gửi Yêu Cầu</button>
                                    </Col>
                                </Row>
                            </form>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Styles>
    );
}

export default HelpArea

