import React from 'react';
import { Link } from 'react-router-dom';
import { Styles } from '../styles/courseTag';
import { useCourseCategories } from '../../../hooks/useCourseCategories';

const CourseTag = () => {
    const { categories } = useCourseCategories();

    return (
        <Styles>
            {/* Course Tag */}
            <div className="course-tag">
                <h5>Thẻ khóa học</h5>
                <div className="tag-box">
                    {categories.map((cat: any) => (
                        <Link 
                            key={cat.maDM} 
                            to={process.env.PUBLIC_URL + `/course-grid?categoryId=${cat.maDM}`}
                        >
                            {cat.tenDM}
                        </Link>
                    ))}
                </div>
            </div>
        </Styles>
    );
};

export default CourseTag;
