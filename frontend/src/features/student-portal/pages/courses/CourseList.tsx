import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import CourseSidebar from './components/CourseSidebar';
import CourseItemList from './components/CourseItemsList';
import { Styles } from './styles/course';

const CourseList = () => {
    const [filters, setFilters] = useState({
        search: '',
        categoryId: null,
        price: null
    });

    return (
        <div className="main-wrapper course-page">

            {/* Breadcroumb */}
            <BreadcrumbBox title="Khóa học" />

            <Styles>
                {/* Course Grid */}
                <section className="course-list-area">
                    <Container>
                        <Row>
                            <Col lg="3" md="4" sm="5">
                                <CourseSidebar filters={filters} setFilters={setFilters} />
                            </Col>
                            <Col lg="9" md="8" sm="7">
                                <div className="course-items2">
                                    <Row>
                                        <CourseItemList filters={filters} />
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

export default CourseList;