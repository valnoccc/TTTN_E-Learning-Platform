import React, { Component } from 'react';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import AboutUs from '../../components/AboutUs';
import IconBox from '../../components/IconBox';
import TabBox from './../../components/TabBox';
import TestimonialSlider from '../../components/TestimonialSlider';
import FaqEvent from '../../components/FaqEvent';
import { Styles } from "./styles/about";

class About extends Component {

    render() {
        return (
            <Styles>
                {/* Main Wrapper */}
                <div className="main-wrapper about-page">

{/* Breadcroumb */}
                    <BreadcrumbBox title="About Us" />

                    {/* About Area */}
                    <AboutUs />

                    {/* Icon Box Area */}
                    <IconBox />

                    {/* Tab Section */}
                    <TabBox />

                    {/* Testimonial Slider */}
                    <TestimonialSlider />

                    {/* Faq & Event Area */}
                    <FaqEvent />

</div>
            </Styles>
        )
    }
}

export default About