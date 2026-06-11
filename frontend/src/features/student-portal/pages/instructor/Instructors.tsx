import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import Pagination from './../../components/Pagination';
import { Styles } from './styles/instructor';
import axiosClient from '../../../../api/axios';

interface InstructorData {
    id: number;
    personName: string;
    personImage: string;
    personTitle: string;
    socialLinks: {
        facebook: string;
        instagram: string;
        github: string;
        website: string;
    };
}

const Instructor = () => {
    const [instructors, setInstructors] = useState<InstructorData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                const response = await axiosClient.get('/public/instructors');
                setInstructors(response as unknown as InstructorData[]);
            } catch (error) {
                console.error('Lỗi khi lấy danh sách giảng viên:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructors();
    }, []);

    return (
        <Styles>
            {/* Main Wrapper */}
            <div className="main-wrapper instructor-page">

                {/* Breadcroumb */}
                <BreadcrumbBox title="Giảng viên" />

                {/* Instructor Area */}
                <section className="instructor-area">
                    <Container>
                        <Row>
                            {loading ? (
                                <Col md="12" className="text-center">
                                    <p>Đang tải danh sách giảng viên...</p>
                                </Col>
                            ) : instructors.length === 0 ? (
                                <Col md="12" className="text-center">
                                    <p>Không có giảng viên nào.</p>
                                </Col>
                            ) : (
                                instructors.map((data, i) => (
                                    <Col lg="3" md="4" sm="6" key={data.id || i}>
                                        <div className="instructor-item">
                                            <Link to={`/instructor-details/${data.id}`}>
                                                <div style={{ overflow: 'hidden', borderRadius: '5px' }}>
                                                    <img 
                                                        src={data.personImage.startsWith('http') ? data.personImage : `/assets/images/${data.personImage}`} 
                                                        alt={data.personName} 
                                                        className="img-fluid" 
                                                        style={data.personImage === 'team-3.jpg' ? { transform: 'scale(1.2)', transformOrigin: 'top center' } : {}}
                                                    />
                                                </div>
                                            </Link>
                                            <div className="img-content text-center">
                                                <h5><Link to={`/instructor-details/${data.id}`}>{data.personName}</Link></h5>
                                                <p>{data.personTitle}</p>
                                                <ul className="list-unstyled list-inline">
                                                    {data.socialLinks?.facebook && (
                                                        <li className="list-inline-item"><a href={data.socialLinks.facebook} target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f"></i></a></li>
                                                    )}
                                                    {data.socialLinks?.instagram && (
                                                        <li className="list-inline-item"><a href={data.socialLinks.instagram} target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a></li>
                                                    )}
                                                    {data.socialLinks?.github && (
                                                        <li className="list-inline-item"><a href={data.socialLinks.github} target="_blank" rel="noopener noreferrer"><i className="fab fa-github"></i></a></li>
                                                    )}
                                                    {data.socialLinks?.website && (
                                                        <li className="list-inline-item"><a href={data.socialLinks.website} target="_blank" rel="noopener noreferrer"><i className="las la-globe"></i></a></li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </Col>
                                ))
                            )}

                            <Col md="12" className="text-center">
                                <Pagination />
                            </Col>
                        </Row>
                    </Container>
                </section>

            </div>
        </Styles>
    );
};

export default Instructor;
