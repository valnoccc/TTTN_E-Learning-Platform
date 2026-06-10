import React, { Component } from 'react';
import Datas from '../../data/blog/grid.json';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import Pagination from './../../components/Pagination';
import BlogSidebar from './components/BlogSidebar';
import { Styles } from './styles/blog';

class BlogGrid extends Component {

    render() {
        return (
            <Styles>
                {/* Main Wrapper */}
                <div className="main-wrapper blog-grid-page">

{/* Breadcroumb */}
                    <BreadcrumbBox title="Blog Grid" />

                    {/* Blog Classic */}
                    <section className="blog-grid-area">
                        <Container>
                            <Row>
                                <Col lg="9" md="8" sm="7">
                                    <Row>
                                        {
                                            Datas.map((data, i) => (
                                                <Col lg="6" md="12" key={i}>
                                                    <div className="blog-item">
                                                        <div className="blog-img">
                                                            <Link to={data.postLink}><img src={`/assets/images/${data.postImg}`} alt="" className="img-fluid" /></Link>
                                                        </div>
                                                        <div className="blog-content">
                                                            <div className="blog-auth_date d-flex">
                                                                <div className="author-img d-flex">
                                                                    <Link to={data.authorLink}><img src={`/assets/images/${data.authorImg}`} alt="" /></Link>
                                                                    <p><Link to={data.authorLink}>{data.authorName}</Link></p>
                                                                </div>
                                                                <div className="post-date">
                                                                    <p><i className="las la-calendar"></i> {data.postDate}</p>
                                                                </div>
                                                            </div>
                                                            <div className="blog-title">
                                                                <h6><Link to={data.postLink}>{data.postTitle}</Link></h6>
                                                            </div>
                                                            <div className="blog-desc">
                                                                <p>{data.postDesc}</p>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </Col>
                                            ))
                                        }
                                    </Row>

                                    <div className="text-center">
                                        <Pagination />
                                    </div>
                                </Col>
                                <Col lg="3" md="4" sm="5">
                                    <BlogSidebar />
                                </Col>
                            </Row>
                        </Container>
                    </section>

</div>
            </Styles>
        )
    }
}

export default BlogGrid
