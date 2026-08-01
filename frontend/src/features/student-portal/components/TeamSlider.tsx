import React, { useState, useEffect } from 'react';
import Datas from '../data/team/team-slider.json';
import { Container, Row, Col } from 'react-bootstrap';
import Swiper from 'react-id-swiper';
import { Styles } from "./styles/teamSlider";
import axiosClient from '../../../api/axios';

const TeamSlider = () => {
    const [instructors, setInstructors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                const response = await axiosClient.get('/public/instructors');
                setInstructors(response as any);
            } catch (error) {
                console.error('Lỗi khi lấy danh sách giảng viên:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructors();
    }, []);

    // Fix for Vite CommonJS interop with react-id-swiper
    const SwiperComponent = (Swiper && typeof Swiper === 'object' && 'default' in Swiper) ? (Swiper as any).default : Swiper;

    // Only use actual instructors from the database
    const displayData = instructors;

    const settings = {
        slidesPerView: 4,
        loop: displayData.length > 4,
        speed: 1000,
        autoplay: displayData.length > 4 ? {
            delay: 3000,
            disableOnInteraction: false
        } : false,
        spaceBetween: 30,
        watchSlidesVisibility: true,
        pagination: {
            el: '.slider-dot.text-center',
            clickable: true
        },
        breakpoints: {
            0: {
                slidesPerView: 1
            },
            576: {
                slidesPerView: 2
            },
            768: {
                slidesPerView: 3
            },
            992: {
                slidesPerView: 4
            }
        }
    };

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
                        <Col md="12">
                            <div className="team-slider">
                                {!loading && displayData.length > 0 && (
                                    <SwiperComponent {...settings} key={`swiper-${displayData.length}`}>
                                        {
                                            displayData.map((data: any, i: number) => (
                                                <div className="team-item" key={data.id || i}>
                                                    <div style={{ overflow: 'hidden', borderRadius: '5px', height: '280px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                                                        <img 
                                                            src={data.personImage && data.personImage.startsWith('http') ? data.personImage : `/assets/images/${data.personImage}`} 
                                                            alt={data.personName} 
                                                            className="img-fluid" 
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                                                        />
                                                    </div>
                                                    <div className="img-content text-center">
                                                        <h5>{data.personName}</h5>
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
                                                            {/* Fallback for old dummy data links if they exist */}
                                                            {(!data.id && data.socialLinks?.twitter) && (
                                                                <li className="list-inline-item"><a href={data.socialLinks.twitter} target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a></li>
                                                            )}
                                                            {(!data.id && data.socialLinks?.youtube) && (
                                                                <li className="list-inline-item"><a href={data.socialLinks.youtube} target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a></li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </SwiperComponent>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Styles>
    );
};

export default TeamSlider;
