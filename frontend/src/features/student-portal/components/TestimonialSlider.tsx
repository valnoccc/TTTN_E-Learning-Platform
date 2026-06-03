import React, { Component } from 'react';
import Datas from '../data/testimonial/testimonial-slider.json';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/testimonialSlider";

class TestimonialSlider extends Component {
    render() {
        return (
            <Styles>
                <section className="testimonial-area" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/${Datas.backgroundImage})` }}>
                    <Container>
                        <Row>
                            <Col md="12">
                                <div className="sec-title text-center">
                                    <h4>{Datas.secTitle}</h4>
                                </div>
                            </Col>
                            {
                                Datas.dataList.map((data, i) => (
                                    <Col md="6" key={i}>
                                        <div className="slider-item">
                                            <div className="desc">
                                                <h5>{data.testimonialTitle}</h5>
                                                <p>{data.testimonialDesc}</p>
                                            </div>
                                            <div className="writer">
                                                <img src={process.env.PUBLIC_URL + `/assets/images/${data.authorImg}`} className="slider-image" alt={data.authorImg} />
                                                <h6>{data.authorName}</h6>
                                                <p>{data.authorTitle}</p>
                                            </div>
                                        </div>
                                    </Col>
                                ))
                            }
                        </Row>
                    </Container>
                </section>
            </Styles>
        );
    }
}

export default TestimonialSlider;
