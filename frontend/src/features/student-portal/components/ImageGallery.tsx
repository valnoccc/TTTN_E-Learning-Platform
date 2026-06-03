import React, { Component } from 'react';
import Datas from '../data/gallery/gallery.json';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/imageGallery";

class ImageGallery extends Component {
    render() {
        return (
            <Styles>
                <section className="gallery-area">
                    <Container fluid>
                        <Row>
                            {
                                Datas.map((data, i) => (
                                    <Col md="3" sm="6" className="padding-fix" key={i}>
                                        <div className="gallery-box">
                                            <img src={process.env.PUBLIC_URL + `/assets/images/${data.galleryImage}`} alt="" />
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

export default ImageGallery;
