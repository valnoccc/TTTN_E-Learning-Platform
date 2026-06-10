import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Styles } from '../styles/courseTag';

class CourseTag extends Component {
    render() {
        return (
            <Styles>
                {/* Course Tag */}
                <div className="course-tag">
                    <h5>Course Tag</h5>
                    <div className="tag-box">
                        <Link to={"/"}>HTML</Link>
                        <Link to={"/"}>CSS</Link>
                        <Link to={"/"}>Photoshop</Link>
                        <Link to={"/"}>Jquery</Link>
                        <Link to={"/"}>PHP</Link>
                        <Link to={"/"}>Wordpress</Link>
                        <Link to={"/"}>Bootstrap</Link>
                        <Link to={"/"}>Javascript</Link>
                    </div>
                </div>
            </Styles>
        )
    }
}

export default CourseTag

