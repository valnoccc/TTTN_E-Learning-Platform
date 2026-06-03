import React, { Component } from 'react';
import Datas from '../data/free-course/free-course.json';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/freeCourse";

type FreeCourseState = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
};

class FreeCourse extends Component<unknown, FreeCourseState> {
    intervalId?: number;

    state: FreeCourseState = {
        days: 4,
        hours: 12,
        minutes: 30,
        seconds: 0
    };

    componentDidMount() {
        this.intervalId = window.setInterval(() => {
            this.setState((prev) => {
                let { days, hours, minutes, seconds } = prev;
                if (seconds > 0) {
                    return { ...prev, seconds: seconds - 1 };
                }
                if (minutes > 0) {
                    return { ...prev, minutes: minutes - 1, seconds: 59 };
                }
                if (hours > 0) {
                    return { ...prev, hours: hours - 1, minutes: 59, seconds: 59 };
                }
                if (days > 0) {
                    return { ...prev, days: days - 1, hours: 23, minutes: 59, seconds: 59 };
                }
                return prev;
            });
        }, 1000);
    }

    componentWillUnmount() {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
        }
    }

    render() {
        const { days, hours, minutes, seconds } = this.state;

        return (
            <Styles>
                <section className="free-course-area">
                    <Container>
                        <Row>
                            <Col md="7">
                                <div className="course-text">
                                    <h4>{Datas.secTitle}</h4>
                                    <p>{Datas.subTitle}</p>
                                </div>
                                <div className="countdown-timer">
                                    <p><span>{String(days).padStart(2, '0')}</span>Days</p>
                                    <p><span>{String(hours).padStart(2, '0')}</span>Hours</p>
                                    <p><span>{String(minutes).padStart(2, '0')}</span>Minutes</p>
                                    <p><span>{String(seconds).padStart(2, '0')}</span>Seconds</p>
                                </div>
                            </Col>
                            <Col md="5">
                                <div className="register-form text-center" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/${Datas.formBackground})` }}>
                                    <div className="form-box">
                                        <h4 className="title">Sign Up Now</h4>
                                        <p className="desc">Get Free Courses</p>
                                        <form id="form3" className="form">
                                            <p className="form-control">
                                                <input type="text" placeholder="Enter your Name" id="name3" />
                                                <span className="input-msg3"></span>
                                            </p>
                                            <p className="form-control">
                                                <input type="email" placeholder="Enter your Email" id="email3" />
                                                <span className="input-msg3"></span>
                                            </p>
                                            <p className="form-control">
                                                <input type="text" placeholder="Enter Phone NUmber" id="phone3" />
                                                <span className="input-msg3"></span>
                                            </p>
                                            <button>Send Request</button>
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
}

export default FreeCourse;
