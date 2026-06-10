import React, { Component } from 'react';
import Datas from '../../data/event/events.json';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import Pagination from '../../components/Pagination';
import CourseSidebar from '../courses/components/CourseSidebar';
import { Styles } from './styles/event';

class Events extends Component {
    render() {

        return (
            <Styles>
                {/* Main Wrapper */}
                <div className="main-wrapper event-page">

{/* Breadcroumb */}
                    <BreadcrumbBox title="Events" />

                    {/* Events Area */}
                    <section className="event-page-area">
                        <Container>
                            <Row>
                                <Col lg="9" md="12">
                                    {
                                        Datas.map((data, i) => (
                                            <div className="event-box" key={i}>
                                                <Row>
                                                    <Col xl="3" lg="4" md={0}>
                                                        <div className="event-img">
                                                            <Link to={data.eventLink}><img src={`/assets/images/${data.eventImg}`} alt="" className="img-fluid" /></Link>
                                                        </div>
                                                    </Col>
                                                    <Col xl="9" lg="8" md="12">
                                                        <div className="event-content">
                                                            <div className="content-box">
                                                                <Row>
                                                                    <Col md="9">
                                                                        <div className="event-title">
                                                                            <h6><Link to={data.eventLink}>{data.eventTitle}</Link></h6>
                                                                        </div>
                                                                        <div className="event-time-location">
                                                                            <ul className="list-unstyled list-inline">
                                                                                <li className="list-inline-item"><i className="las la-clock"></i> {data.eventTime}</li>
                                                                                <li className="list-inline-item"><i className="las la-map-marker"></i> {data.eventLocation}</li>
                                                                            </ul>
                                                                        </div>
                                                                        <div className="event-desc">
                                                                            <p>{data.eventdesc}</p>
                                                                        </div>
                                                                    </Col>
                                                                    <Col md="3" className="text-center">
                                                                        <div className="event-date">
                                                                            <p>{data.eventDate}</p>
                                                                        </div>
                                                                        <div className="join-btn">
                                                                            <Link to={data.eventLink}>Join Now</Link>
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </div>
                                        ))
                                    }

                                    <Col md="12" className="text-center">
                                        <Pagination />
                                    </Col>
                                </Col>

                                <Col lg="3" md={0}>
                                    <CourseSidebar />
                                </Col>

                            </Row>
                        </Container>
                    </section>

</div>
            </Styles>
        )
    }
}

export default Events

