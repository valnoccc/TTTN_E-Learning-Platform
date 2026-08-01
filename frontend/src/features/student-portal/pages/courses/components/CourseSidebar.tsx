import React from 'react';
import { Row, Col } from 'react-bootstrap';
import CourseSearch from './CourseSearch';
import CoursePrice from './CoursePrice';
import PopularCourse from './PopularCourse';
import CourseTag from './CourseTag';
import CourseCategory from './CourseCategory';
import CourseRating from './CourseRating';
import CourseSort from './CourseSort';

const CourseSidebar = ({ filters, setFilters }: { filters: any, setFilters: any }) => {
    return (
        <div className="course-sidebar">
            <Row>
                <Col md="12">
                    <CourseSearch filters={filters} setFilters={setFilters} />
                </Col>
                <Col md="12">
                    <CourseCategory filters={filters} setFilters={setFilters} />
                </Col>
                <Col md="12">
                    <CoursePrice filters={filters} setFilters={setFilters} />
                </Col>
                <Col md="12">
                    <CourseRating filters={filters} setFilters={setFilters} />
                </Col>
                <Col md="12">
                    <CourseSort filters={filters} setFilters={setFilters} />
                </Col>
                <Col md="12">
                    <PopularCourse />
                </Col>
                <Col md="12">
                    <CourseTag />
                </Col>
            </Row>
        </div>
    );
};

export default CourseSidebar;
