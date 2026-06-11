import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import GoogleMap from './GoogleMap';
import { Styles } from './styles/contact';

function Contact() {
    useEffect(() => {
        const form = document.getElementById("form_contact") as HTMLFormElement | null;
        const name = document.getElementById("contact_name") as HTMLInputElement | null;
        const email = document.getElementById("contact_email") as HTMLInputElement | null;
        const subject = document.getElementById("contact_subject") as HTMLInputElement | null;
        const message = document.getElementById("contact_message") as HTMLTextAreaElement | null;

        if (!form || !name || !email || !subject || !message) {
            return;
        }

        const nameInput = name;
        const emailInput = email;
        const subjectInput = subject;
        const messageInput = message;

        form.addEventListener("submit", formSubmit);

        function formSubmit(e: SubmitEvent) {
            e.preventDefault();

            const nameValue = nameInput.value.trim();
            const emailValue = emailInput.value.trim();
            const subjectValue = subjectInput.value.trim();
            const messageValue = messageInput.value.trim();

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
                setError(subjectInput, "Chủ đề không được để trống");
            } else {
                setSuccess(subjectInput);
            }

            if (messageValue === "") {
                setError(messageInput, "Nội dung không được để trống");
            } else {
                setSuccess(messageInput);
            }
        }

        function setError(input: HTMLInputElement | HTMLTextAreaElement, message: string) {
            const formControl = input.parentElement as HTMLElement | null;
            const errorMsg = formControl?.querySelector(".contact_input-msg") as HTMLElement | null;
            if (!formControl || !errorMsg) {
                return;
            }
            formControl.className = "form-control text-left error";
            errorMsg.innerText = message;
        }

        function setSuccess(input: HTMLInputElement | HTMLTextAreaElement) {
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
            {/* Main Wrapper */}
            <div className="main-wrapper contact-page">

{/* Breadcroumb */}
                <BreadcrumbBox title="Liên hệ" />

                {/* Contact Area */}
                <section className="contact-area">
                    <Container>
                        <Row>
                            <Col md="4">
                                <div className="contact-box-title">
                                    <h4>Contact Info</h4>
                                </div>
                                <div className="contact-icon-box d-flex">
                                    <div className="icon">
                                        <i className="las la-map-marker"></i>
                                    </div>
                                    <div className="box-content">
                                        <h5>Địa chỉ</h5>
                                        <p>123 Sư Vạn Hạnh, Quận 10, TP.HCM</p>
                                    </div>
                                </div>
                                <div className="contact-icon-box d-flex">
                                    <div className="icon">
                                        <i className="las la-envelope-open"></i>
                                    </div>
                                    <div className="box-content">
                                        <h5>Địa chỉ Email</h5>
                                        <p>hotro@edumeo.vn</p>
                                    </div>
                                </div>
                                <div className="contact-icon-box d-flex">
                                    <div className="icon">
                                        <i className="las la-phone"></i>
                                    </div>
                                    <div className="box-content">
                                        <h5>Số điện thoại</h5>
                                        <p>+84 123 456 789</p>
                                    </div>
                                </div>
                                <div className="contact-social">
                                    <ul className="social list-unstyled list-inline">
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-facebook-f"></i></a></li>
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-twitter"></i></a></li>
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-linkedin-in"></i></a></li>
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-youtube"></i></a></li>
                                        <li className="list-inline-item"><a href={"/"}><i className="fab fa-dribbble"></i></a></li>
                                    </ul>
                                </div>
                            </Col>
                            <Col md="8">
                                <div className="contact-form">
                                    <div className="form-title">
                                        <h4>Gửi tin nhắn cho chúng tôi</h4>
                                    </div>
                                    <div className="form-box">
                                        <form id="form_contact" className="form">
                                            <Row>
                                                <Col md="6">
                                                    <p className="form-control">
                                                        <input type="text" placeholder="Họ và tên" id="contact_name" />
                                                        <span className="contact_input-msg"></span>
                                                    </p>
                                                </Col>
                                                <Col md="6">
                                                    <p className="form-control">
                                                        <input type="email" placeholder="Địa chỉ Email" id="contact_email" />
                                                        <span className="contact_input-msg"></span>
                                                    </p>
                                                </Col>
                                                <Col md="12">
                                                    <p className="form-control">
                                                        <input type="text" placeholder="Chủ đề" id="contact_subject" />
                                                        <span className="contact_input-msg"></span>
                                                    </p>
                                                </Col>
                                                <Col md="12">
                                                    <p className="form-control">
                                                        <textarea name="message" id="contact_message" placeholder="Nhập nội dung tin nhắn"></textarea>
                                                        <span className="contact_input-msg"></span>
                                                    </p>
                                                </Col>
                                                <Col md="12">
                                                    <button>Gửi tin nhắn</button>
                                                </Col>
                                            </Row>
                                        </form>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>

                    {/* Google Map */}
                    <GoogleMap />
                </section>

</div>
        </Styles>
    )
}

export default Contact

