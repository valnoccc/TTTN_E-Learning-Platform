import React, { useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Styles } from '../styles/commentForm';

function CommentForm() {
    useEffect(() => {
        const form = document.getElementById("comment_form") as HTMLFormElement | null;
        const desc = document.getElementById("comment_form-desc") as HTMLTextAreaElement | null;
        const name = document.getElementById("comment_form-name") as HTMLInputElement | null;
        const email = document.getElementById("comment_form-email") as HTMLInputElement | null;

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
            const errorMsg = formControl?.querySelector(".comment_form-input-msg") as HTMLElement | null;
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
            {/* Comment Form */}
            <div className="blog-comment-form">
                <h5>Leave a message here</h5>
                <form id="comment_form" className="form">
                    <Row>
                        <Col md="12">
                            <p className="form-control">
                                <textarea name="comment" id="comment_form-desc" placeholder="Enter your comment"></textarea>
                                <span className="comment_form-input-msg"></span>
                            </p>
                        </Col>
                        <Col md="6">
                            <p className="form-control">
                                <input type="name" placeholder="Enter your name" id="comment_form-name" />
                                <span className="comment_form-input-msg"></span>
                            </p>
                        </Col>
                        <Col md="6">
                            <p className="form-control">
                                <input type="email" placeholder="Enter your email" id="comment_form-email" />
                                <span className="comment_form-input-msg"></span>
                            </p>
                        </Col>
                        <Col md="12">
                            <button>Post Comment</button>
                        </Col>
                    </Row>
                </form>
            </div>
        </Styles>
    )
}

export default CommentForm
