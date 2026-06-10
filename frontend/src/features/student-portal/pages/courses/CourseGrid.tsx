import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import CourseSidebar from './components/CourseSidebar';
import CourseItemGrid from './components/CourseItemsGrid';
import { Styles } from './styles/course';

const CourseGrid = () => {
    const [filters, setFilters] = useState({
        search: '',
        categoryId: null,
        price: null
    });

    return (
        <div className="main-wrapper course-page">

            {/* Breadcroumb */}
            <BreadcrumbBox title="Courses" />

            <Styles>
                {/* Course Grid */}
                <section className="course-grid-area">
                    <Container>
                        <Row>
                            <Col lg="3" md="4" sm="5">
                                <CourseSidebar filters={filters} setFilters={setFilters} />
                            </Col>
                            <Col lg="9" md="8" sm="7">
                                <div className="course-items">
                                    <Row>
                                        <CourseItemGrid filters={filters} />
                                    </Row>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </Styles>

        </div>
    );
};

export default CourseGrid;