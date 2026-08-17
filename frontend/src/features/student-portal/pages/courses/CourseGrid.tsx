import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import CourseSidebar from './components/CourseSidebar';
import CourseItemGrid from './components/CourseItemsGrid';
import PopularCourse from './components/PopularCourse';
import { Styles } from './styles/course';

const CourseGrid = () => {
    const [searchParams] = useSearchParams();

    // Bóc tách tham số search từ URL (?search=từ_khóa)
    const searchQuery = searchParams.get('search') || '';
    const categoryIdParam = searchParams.get('categoryId');

    const [filters, setFilters] = useState<any>({
        search: searchQuery,
        categoryId: categoryIdParam ? Number(categoryIdParam) : null,
        price: null,
        rating: null,
        sort: null
    });

    // Đồng bộ filters mỗi khi URL thay đổi (click keyword, submit form search)
    useEffect(() => {
        const newSearch = searchParams.get('search') || '';
        const newCategoryId = searchParams.get('categoryId');
        setFilters((prev: any) => ({
            ...prev,
            search: newSearch,
            categoryId: newCategoryId ? Number(newCategoryId) : prev.categoryId,
        }));
    }, [searchParams]);

    return (
        <div className="main-wrapper course-page">

            {/* Breadcrumb */}
            <BreadcrumbBox title={searchQuery ? `Kết quả: "${searchQuery}"` : 'Khóa học'} />

            <Styles>
                {/* Course Grid */}
                <section className="course-grid-area">
                    <Container fluid className="px-xl-5 px-lg-4 px-3">
                        <Row>
                            {/* Left Sidebar - Filters */}
                            <Col lg="3" md="4" sm="12">
                                <CourseSidebar filters={filters} setFilters={setFilters} />
                                
                            </Col>
                            
                            {/* Main Course Grid */}
                            <Col lg="6" md="8" sm="12">
                                <div className="course-items">
                                    <Row>
                                        <CourseItemGrid filters={filters} />
                                    </Row>
                                </div>
                            </Col>
                            
                            {/* Right Sidebar - Popular Courses */}
                            <Col lg="3" md="12">
                                <div className="course-sidebar">
                                    <Row>
                                        <Col md="12">
                                            <PopularCourse />
                                        </Col>
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