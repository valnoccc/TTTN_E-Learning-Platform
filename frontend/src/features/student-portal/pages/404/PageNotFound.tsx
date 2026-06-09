import React, { Component } from 'react';
import Datas from '../../data/404/error.json';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from './styles/pageNotFound';

class PageNotFound extends Component {
    render() {
        return (
            <Styles>
                {/* Main Wrapper */}
                <div className="main-wrapper error-page">

{/* 404 Area */}
                    <section className="error-area" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/${Datas.backgroundImage})` }}>
                        <Container>
                            <Row>
                                <Col md="12">
                                    <div className="error-box text-center">
                                        <h1>4<span>0</span>4</h1>
                                        <h3>Page Not Found</h3>
                                        <p>Ooops! The page you are looking for, couldn't be found.</p>
                                        <Link to={process.env.PUBLIC_URL + "/"}><i className="fas fa-home"></i>Go To Homepage</Link>
                                    </div>
                                </Col>
                            </Row>
                        </Container>
                    </section>

</div>
            </Styles>
        )
    }
}

export default PageNotFound