import React, { useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Styles } from '../styles/reviewForm';

function ReviewForm() {
    useEffect(() => {
        const form = document.getElementById("form6") as HTMLFormElement | null;
        const desc = document.getElementById("desc6") as HTMLTextAreaElement | null;
        const name = document.getElementById("name6") as HTMLInputElement | null;
        const email = document.getElementById("email6") as HTMLInputElement | null;

        if (!form || !desc || !name || !email) {
            return;
        }

        const descInput = desc;
        const nameInput = name;
        const emailInput = email;

        form.addEventListener("submit", formSubmit);

        function formSubmit(e: SubmitEvent) {
            e.preventDefault();

            const descValue = descInput.value.trim();
            const nameValue = nameInput.value.trim();
            const emailValue = emailInput.value.trim();

            if (descValue === "") {
                setError(descInput, "Comment can't be blank");
            } else {
                setSuccess(descInput);
            }

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

        function setError(input: HTMLTextAreaElement | HTMLInputElement, message: string) {
            const formControl = input.parentElement as HTMLElement | null;
            const errorMsg = formControl?.querySelector(".input-msg6") as HTMLElement | null;
            if (!formControl || !errorMsg) {
                return;
            }
            formControl.className = "form-control error";
            errorMsg.innerText = message;
        }

        function setSuccess(input: HTMLTextAreaElement | HTMLInputElement) {
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
            <form id="form6" className="form review-comment-form">
                <Row>
                    <Col md="12">
                        <div className="star-rating">
                            <input type="radio" name="rate" id="rate-5" />
                            <label htmlFor="rate-5" className="las la-star"></label>
                            <input type="radio" name="rate" id="rate-4" />
                            <label htmlFor="rate-4" className="las la-star"></label>
                            <input type="radio" name="rate" id="rate-3" />
                            <label htmlFor="rate-3" className="las la-star"></label>
                            <input type="radio" name="rate" id="rate-2" />
                            <label htmlFor="rate-2" className="las la-star"></label>
                            <input type="radio" name="rate" id="rate-1" />
                            <label htmlFor="rate-1" className="las la-star"></label>
                        </div>
                    </Col>
                    <Col md="12">
                        <p className="form-control">
                            <textarea name="comment" id="desc6" placeholder="Enter your review"></textarea>
                            <span className="input-msg6"></span>
                        </p>
                    </Col>
                    <Col md="6">
                        <p className="form-control">
                            <input type="name" placeholder="Enter your name" id="name6" />
                            <span className="input-msg6"></span>
                        </p>
                    </Col>
                    <Col md="6">
                        <p className="form-control">
                            <input type="email" placeholder="Enter your email" id="email6" />
                            <span className="input-msg6"></span>
                        </p>
                    </Col>
                    <Col md="12">
                        <button>Submit Review</button>
                    </Col>
                </Row>
            </form>
        </Styles>
    )
}

export default ReviewForm
