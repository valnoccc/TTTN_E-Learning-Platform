import React, { useState, useEffect } from 'react';
import { Styles } from '../styles/courseCategory';
import axiosClient from '../../../../../api/axios';

const CourseCategory = ({ filters, setFilters }: { filters: any, setFilters: any }) => {
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res: any = await axiosClient.get('/categories');
                if (res) {
                    setCategories(res);
                }
            } catch (error) {
                console.error('Error fetching categories', error);
            }
        };
        fetchCategories();
    }, []);

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
