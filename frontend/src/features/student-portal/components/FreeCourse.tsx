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
                                    <p><span>{String(days).padStart(2, '0')}</span>Ngày</p>
                                    <p><span>{String(hours).padStart(2, '0')}</span>Giờ</p>
                                    <p><span>{String(minutes).padStart(2, '0')}</span>Phút</p>
                                    <p><span>{String(seconds).padStart(2, '0')}</span>Giây</p>
                                </div>
                            </Col>
                            <Col md="5">
                                <div className="register-form text-center" style={{ backgroundImage: `url(/assets/images/${Datas.formBackground})` }}>
                                    <div className="form-box">
                                        <h4 className="title">Đăng Ký Ngay</h4>
                                        <p className="desc">Nhận Khóa Học Miễn Phí</p>
                                        <form id="form3" className="form">
                                            <p className="form-control">
                                                <input type="text" placeholder="Nhập Tên của bạn" id="name3" />
                                                <span className="input-msg3"></span>
                                            </p>
                                            <p className="form-control">
                                                <input type="email" placeholder="Nhập Email của bạn" id="email3" />
                                                <span className="input-msg3"></span>
                                            </p>
                                            <p className="form-control">
                                                <input type="text" placeholder="Nhập Số Điện Thoại" id="phone3" />
                                                <span className="input-msg3"></span>
                                            </p>
                                            <button>Gửi Yêu Cầu</button>
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

