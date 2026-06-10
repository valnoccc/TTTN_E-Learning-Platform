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
                                    <Col md="3" sm="6" key={i}>
                                        <div className="gallery-box" style={{ marginBottom: '30px' }}>
                                            <img src={`/assets/images/${data.galleryImage}`} alt="" className="img-fluid" />
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

