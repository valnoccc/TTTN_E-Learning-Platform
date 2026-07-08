import React from 'react';
import { Styles } from '../styles/courseCategory';
import { useCourseCategories } from '../../../hooks/useCourseCategories';

const CourseCategory = ({ filters, setFilters }: { filters: any, setFilters: any }) => {
    const { categories } = useCourseCategories();

    const handleCategoryChange = (categoryId: number) => {
        if (filters.categoryId === categoryId) {
            setFilters({ ...filters, categoryId: null });
        } else {
            setFilters({ ...filters, categoryId });
        }
    };

    return (
        <Styles>
            {/* Course Category */}
            <div className="course-category">
                <h5>Danh mục khóa học</h5>
                <ul className="category-item list-unstyled">
                    {categories.map((cat: any) => (
                        <li className="check-btn" key={cat.maDM}>
                            <label htmlFor={`cat-${cat.maDM}`}>
                                <input 
                                    type="checkbox" 
                                    id={`cat-${cat.maDM}`} 
                                    className="check-box" 
                                    checked={filters.categoryId === cat.maDM}
                                    onChange={() => handleCategoryChange(cat.maDM)}
                                />
                                {cat.tenDM}
                            </label>
                        </li>
                    ))}
                </ul>
            </div>
        </Styles>
    );
};

export default CourseCategory;
