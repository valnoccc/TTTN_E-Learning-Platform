import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Styles } from "./styles/homeBlog";
import axiosClient from '../../../api/axios';

function formatDateShort(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day} Th${month}`;
}

export default function HomeBlog() {
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res: any = await axiosClient.get('/posts', {
                    params: { page: 1, limit: 4 }
                });
                setPosts(res?.data || []);
            } catch (err) {
                console.error('Error fetching home blog posts', err);
            }
        };
        fetchPosts();
    }, []);

    return (
        <Styles>
            <section className="home-blog-area">
                <Container>
                    <Row>
                        <Col md="12">
                            <div className="sec-title text-center">
                                <h4>Xem Những Bài Viết Mới Nhất Trên Blog Của Chúng Tôi.</h4>
                            </div>
                        </Col>
                        {
                            posts.map((data, i) => (
                                <Col md="6" key={data.maBV || i}>
                                    <div className="blog-post">
                                        <Row>
                                            <Col lg="6" md="12">
                                                <div className="blog-img" style={{ height: '100%' }}>
                                                    <Link to={`/blog/${data.slug}`}>
                                                        <img 
                                                            src={data.hinhAnh || '/assets/images/blog-1.jpg'} 
                                                            alt={data.tieuDe} 
                                                            className="img-fluid" 
                                                            style={{ height: '220px', width: '100%', objectFit: 'cover' }}
                                                            onError={(e: any) => { e.target.src = '/assets/images/blog-1.jpg'; }}
                                                        />
                                                    </Link>
                                                </div>
                                            </Col>
                                            <Col lg="6" md="12">
                                                <div className="blog-content">
                                                    <div className="content-box">
                                                        <div className="top-content d-flex">
                                                            <div className="blog-date text-center">
                                                                <p>{formatDateShort(data.ngayTao)}</p>
                                                            </div>
                                                            <div className="blog-title">
                                                                <h6 style={{ height: '56px', overflow: 'hidden' }}>
                                                                    <Link to={`/blog/${data.slug}`}>
                                                                        {data.tieuDe?.length > 55 ? data.tieuDe.substring(0, 55) + '...' : data.tieuDe}
                                                                    </Link>
                                                                </h6>
                                                            </div>
                                                        </div>
                                                        <div className="blog-desk">
                                                            <p style={{ height: '52px', overflow: 'hidden', marginBottom: '10px' }}>
                                                                {data.tomTat?.length > 70 ? data.tomTat.substring(0, 70) + '...' : data.tomTat}
                                                            </p>
                                                            <ul className="list-unstyled list-inline mt-2">
                                                                <li className="list-inline-item">
                                                                    <Link to={`/blog/${data.slug}`} style={{pointerEvents: 'none'}}><i className="las la-user"></i> {data.tacGia?.hoTen || 'Admin'}</Link>
                                                                </li>
                                                                <li className="list-inline-item">
                                                                    <Link to={`/blog/${data.slug}`} style={{pointerEvents: 'none'}}><i className="las la-comment"></i> 0</Link>
                                                                </li>
                                                                <li className="list-inline-item">
                                                                    <Link to={`/blog/${data.slug}`} style={{pointerEvents: 'none'}}><i className="las la-eye"></i> {data.luotXem || 0}</Link>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
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

