import React, { Component } from 'react';
import Datas from '../data/team/team-slider.json';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/teamSlider";

class TeamSlider extends Component {
    render() {
        return (
            <Styles>
                <section className="team-member-area">
                    <Container>
                        <Row>
                            <Col md="12">
                                <div className="sec-title text-center">
                                    <h4>{Datas.secTitle}</h4>
                                </div>
                            </Col>
                            {
                                Datas.dataList.map((data, i) => (
                                    <Col md="3" sm="6" key={i}>
                                        <div className="team-item">
                                            <img src={process.env.PUBLIC_URL + `/assets/images/${data.personImage}`} alt="" className="img-fluid" />
                                            <div className="img-content text-center">
                                                <h5>{data.personName}</h5>
                                                <p>{data.personTitle}</p>
                                                <ul className="list-unstyled list-inline">
                                                    <li className="list-inline-item"><a href={process.env.PUBLIC_URL + data.socialLinks.facebook}><i className="fab fa-facebook-f"></i></a></li>
                                                    <li className="list-inline-item"><a href={process.env.PUBLIC_URL + data.socialLinks.twitter}><i className="fab fa-twitter"></i></a></li>
                                                    <li className="list-inline-item"><a href={process.env.PUBLIC_URL + data.socialLinks.youtube}><i className="fab fa-youtube"></i></a></li>
                                                </ul>
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

export default TeamSlider;
