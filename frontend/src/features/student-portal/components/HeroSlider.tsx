import React, { Component } from 'react';
import Datas from '../data/hero/hero-slider.json';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Swiper from 'react-id-swiper';
import { Styles } from "./styles/heroSlider";

class HeroSlider extends Component {
    render() {
        // Fix for Vite CommonJS interop with react-id-swiper
        const SwiperComponent = (Swiper && typeof Swiper === 'object' && 'default' in Swiper) ? (Swiper as any).default : Swiper;

        const settings = {
            slidesPerView: 1,
            loop: true,
            speed: 3000,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false
            },
            watchSlidesVisibility: true,
            effect: 'fade',
            navigation: {
                nextEl: '.slider-button-next',
                prevEl: '.slider-button-prev'
            },
            renderPrevButton: () => (
                <div className="swiper-btn slider-button-prev"><i className="flaticon-arrow-left-th"></i></div>
            ),
            renderNextButton: () => (
                <div className="swiper-btn slider-button-next"><i className="flaticon-arrow-right-th"></i></div>
            )
        };

        return (
            <Styles>
                {/* Hero Slider */}
                <section className="hero-slider-area">
                    <SwiperComponent {...settings}>
                        {
                            Datas.map((data, i) => (
                                <div className="slider-item" key={i}>
                                    <div className="image-container">
                                        <img src={`/assets/images/${data.backgroundImage}`} className="slider-image" alt={data.backgroundImage} />
                                    </div>
                                    <div className="slider-table">
                                        <div className="slider-tablecell" style={{ display: 'table-cell', verticalAlign: 'middle' }}>
                                            <Container>
                                                <Row>
                                                    <Col md="12">
                                                        <div className="hero-box text-center">
                                                            <h1 style={{ fontSize: '46px', color: '#fff', maxWidth: '700px', margin: 'auto', marginBottom: '20px', fontWeight: 600 }}>Khởi Đầu Hành Trình Học Tập Của Bạn</h1>
                                                            <p style={{ fontSize: '16px', color: '#e5e5e5', maxWidth: '600px', lineHeight: '30px', margin: 'auto', marginBottom: '60px' }}>Khám phá hàng ngàn khóa học chất lượng từ các chuyên gia hàng đầu. Nâng cao kỹ năng và phát triển sự nghiệp ngay hôm nay.</p>
                                                            <div className="video-player">
                                                                <a
                                                                    href="https://www.youtube.com/watch?v=uXFUl0KcIkA"
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="play-button"
                                                                    style={{ display: 'inline-block', width: '32px', height: '44px', color: '#fff', fontSize: '40px', position: 'relative', zIndex: 11 }}
                                                                >
                                                                    <i className="las la-play"></i>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Container>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </SwiperComponent>
                    <div className="round-shape" style={{ backgroundImage: `url(/assets/images/r-shape.png)` }}></div>
                </section>
            </Styles>
        )
    }
}

export default HeroSlider

