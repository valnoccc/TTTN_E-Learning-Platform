import React from 'react';
import { Link } from 'react-router-dom';
import { useCourseCategories } from '../../../../pages/instructor/courses/hooks/useCourseCategories';

export const CourseCategoryDropdown = () => {
    const { categories, isLoading } = useCourseCategories();

    return (
        <li className="nav-item dropdown">
            <Link className="nav-link dropdown-toggle" to={"/"} data-toggle="dropdown">Khóa học <i className="las la-angle-down"></i></Link>
            <ul className="dropdown list-unstyled">
                <li className="nav-item">
                    <Link className="nav-link" to={"/course-grid"}>Tất cả khóa học</Link>
                </li>
                {!isLoading && categories.map((cat) => (
                    <li className="nav-item" key={cat.maDM}>
                        <Link className="nav-link" to={`/course-grid?categoryId=${cat.maDM}`}>{cat.tenDM}</Link>
                    </li>
                ))}
            </ul>
        </li>
    );
};

export const CourseCategoryMobile = () => {
    const { categories, isLoading } = useCourseCategories();

    return (
        <div className="mb-menu-item">
            <button className="mb-menu-button">
                <p>Khóa học <i className="las la-plus"></i></p>
            </button>
            <div className="mb-menu-content">
                <ul className="list-unstyled">
                    <li><Link to={"/course-grid"}>Tất cả khóa học</Link></li>
                    {!isLoading && categories.map((cat) => (
                        <li key={cat.maDM}>
                            <Link to={`/course-grid?categoryId=${cat.maDM}`}>{cat.tenDM}</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
