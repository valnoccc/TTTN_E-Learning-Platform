import React, { Component } from 'react';
import CountUp from 'react-countup';
import Datas from '../data/counter/number-counter.json';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/numberCounter";

class NumberCounter extends Component {
    render() {
        // Fix for Vite CommonJS interop with react-countup
        const CountUpComponent = (CountUp && typeof CountUp === 'object' && 'default' in CountUp) ? (CountUp as any).default : CountUp;

        return (
            <Styles>
                {/* Counter Area */}
                <section className="counter-area" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/${Datas.backgroundImage})` }}>
                    <Container>
                        <Row>
                            <Col md="12">
                                <div className="sec-title text-center">
                                    <h4>{Datas.secTitle}</h4>
                                </div>
                            </Col>
                            <Col md="3" xs="6">
                                <div className="counter-box">
                                    <div className="counter-icon">
                                        <i className="las la-university"></i>
                                    </div>
                                    <div className="counter-number">
                                        <h4><CountUpComponent end={1170} duration={3} />+</h4>
                                        <p>University Courses</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md="3" xs="6">
                                <div className="counter-box">
                                    <div className="counter-icon">
                                        <i className="las la-graduation-cap"></i>
                                    </div>
                                    <div className="counter-number">
                                        <h4><CountUpComponent end={2309} duration={3} />+</h4>
                                        <p>Total Students</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md="3" xs="6">
                                <div className="counter-box">
                                    <div className="counter-icon">
                                        <i className="las la-award"></i>
                                    </div>
                                    <div className="counter-number">
                                        <h4><CountUpComponent end={590} duration={3} />+</h4>
                                        <p>Awards Wins</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md="3" xs="6">
                                <div className="counter-box">
                                    <div className="counter-icon">
                                        <i className="las la-book-reader"></i>
                                    </div>
                                    <div className="counter-number">
                                        <h4><CountUpComponent end={3790} duration={3} />+</h4>
                                        <p>Library Books</p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </Styles>
        )
    }
}

export default NumberCounter
