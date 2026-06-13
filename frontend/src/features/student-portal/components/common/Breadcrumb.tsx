import React, { Component } from 'react';
import { Container, Row, Col, Breadcrumb } from 'react-bootstrap';
import { Styles } from "./styles/breadcrumb";

type BreadcrumbBoxProps = {
    title: string;
};

type BreadcrumbBoxState = {
    backgroundImage: string;
};

export class BreadcrumbBox extends Component<BreadcrumbBoxProps, BreadcrumbBoxState> {
    state: BreadcrumbBoxState = {
        backgroundImage: 'breadcrumb-bg.jpg',
    }

    render() {
        return (
            <Styles>
                <section className="breadcrumb-area" style={{ backgroundImage: `url(/assets/images/${this.state.backgroundImage})` }}>
                    <Container>
                        <Row>
                            <Col md="12" className="text-center">
                                <div className="breadcrumb-box">
                                    <h2 className="breadcrumb-title">{this.props.title}</h2>
                                    <Breadcrumb>
                                        <Breadcrumb.Item>Trang chủ</Breadcrumb.Item>
                                        <Breadcrumb.Item active>{this.props.title}</Breadcrumb.Item>
                                    </Breadcrumb>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </Styles>
        )
    }
}

