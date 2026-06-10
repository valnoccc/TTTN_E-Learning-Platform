import React, { Component } from 'react';
import Datas from '../data/hero/hero-image.json';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/heroImage";

class HeroImage extends Component {
    render() {
        return (
            <Styles>
                {/* Hero Image */}
                <section className="hero-image-area" style={{ backgroundImage: `url(/assets/images/${Datas.heroBackground})` }}>
                <div className="round-shape" style={{ backgroundImage: `url(/assets/images/${Datas.heroRoundShape})` }}></div>
                    <div className="hero-table">
                        <div className="hero-tablecell">
                            <Container>
                                <Row>
                                    <Col md="12">
                                        <div className="hero-box text-center">
                                            <h1>{Datas.heroTitle}</h1>
                                            <p>{Datas.heroSubtitle}</p>
                                            <div className="video-player">
                                                <a
                                                    href="https://www.youtube.com/watch?v=uXFUl0KcIkA"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="play-button"
                                                >
                                                    <i className="las la-play"></i>
                                                </a>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Container>
                        </div>
                    </div>
                </section>
            </Styles>
        )
    }
}

export default HeroImage

