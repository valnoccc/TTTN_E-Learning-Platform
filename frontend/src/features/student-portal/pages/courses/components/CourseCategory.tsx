import React, { useState } from 'react';
import { Styles } from '../styles/courseCategory';
import { useCourseCategories } from '../../../hooks/useCourseCategories';

const CourseCategory = ({ filters, setFilters }: { filters: any, setFilters: any }) => {
    const { categories } = useCourseCategories();
    const [isOpen, setIsOpen] = useState(true); //false

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
                <h5 
                    className="cursor-pointer flex items-center justify-between hover:text-emerald-500 transition-colors"
                    // onClick={() => setIsOpen(!isOpen)}
                    style={{ cursor: 'pointer', marginBottom: isOpen ? '20px' : '0' }}
                >
                    Danh mục khóa học
                    {/* <i className={`las ${isOpen ? 'la-angle-up' : 'la-angle-down'} text-xl`}></i> */}
                </h5>
                
                {isOpen && (
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
                )}
            </div>
        </Styles>
    );
};

export default CourseCategory;
