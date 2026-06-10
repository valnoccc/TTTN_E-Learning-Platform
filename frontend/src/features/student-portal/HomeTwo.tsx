import React, { Component } from 'react';
import HeroImage from './components/HeroImage';
import ServiceBox from './components/ServiceBox';
import AboutUsTwo from './components/AboutUsTwo';
import CourseSlider from './components/CourseSlider';
import NumberCounter from './components/NumberCounter';
import FreeCourse from './components/FreeCourse';
import TeamSlider from './components/TeamSlider';
import TestimonialSlider from './components/TestimonialSlider';
import HomeBlog from './components/HomeBlog';
import ImageGallery from './components/ImageGallery';
export default class HomeTwo extends Component {
    render() {
        return (
            <div className="main-wrapper">

{/* Hero Image */}
                <HeroImage />

                {/* Service Box */}
                <ServiceBox />

                {/* About Us 2 */}
                <AboutUsTwo />

                {/* Course Slider */}
                <CourseSlider />

                {/* Counter Area */}
                <NumberCounter />

                {/* Free Course Area */}
                <FreeCourse />

                {/* Team Slider */}
                <TeamSlider />

                {/* Testimonial Slider */}
                <TestimonialSlider />

                {/* Blog Area */}
                <HomeBlog />

                {/* Image Gallery Area */}
                <ImageGallery />

</div>
        )
    }
}
