import React, { useState } from 'react';
import { Styles } from '../styles/coursePrice';

const CourseSort = ({ filters, setFilters }: { filters: any, setFilters: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSortChange = (sortValue: string | null) => {
        if (sortValue !== null && filters.sort === sortValue) {
            setFilters({ ...filters, sort: null });
        } else {
            setFilters({ ...filters, sort: sortValue });
        }
    };

    return (
        <Styles>
            <div className="course-price mt-4">
                <h5 
                    className="cursor-pointer flex items-center justify-between hover:text-emerald-500 transition-colors whitespace-nowrap"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ cursor: 'pointer', marginBottom: isOpen ? '20px' : '0' }}
                >
                    Sắp xếp theo
                    <i className={`las ${isOpen ? 'la-angle-up' : 'la-angle-down'} text-xl`}></i>
                </h5>
                
                {isOpen && (
                    <ul className="price-item list-unstyled">
                        <li className="check-btn">
                            <label htmlFor="sort-default">
                                <input 
                                    type="checkbox" 
                                    id="sort-default" 
                                    className="check-box" 
                                    checked={filters.sort === 'newest'}
                                    onChange={() => handleSortChange('newest')}
                                />
                                Mới nhất
                            </label>
                        </li>
                        <li className="check-btn">
                            <label htmlFor="sort-oldest">
                                <input 
                                    type="checkbox" 
                                    id="sort-oldest" 
                                    className="check-box" 
                                    checked={filters.sort === 'oldest'}
                                    onChange={() => handleSortChange('oldest')}
                                />
                                Cũ nhất
                            </label>
                        </li>
                        <li className="check-btn">
                            <label htmlFor="sort-name-asc">
                                <input 
                                    type="checkbox" 
                                    id="sort-name-asc" 
                                    className="check-box" 
                                    checked={filters.sort === 'name_asc'}
                                    onChange={() => handleSortChange('name_asc')}
                                />
                                Tên (A-Z)
                            </label>
                        </li>
                        <li className="check-btn">
                            <label htmlFor="sort-name-desc">
                                <input 
                                    type="checkbox" 
                                    id="sort-name-desc" 
                                    className="check-box" 
                                    checked={filters.sort === 'name_desc'}
                                    onChange={() => handleSortChange('name_desc')}
                                />
                                Tên (Z-A)
                            </label>
                        </li>
                        <li className="check-btn">
                            <label htmlFor="sort-price-asc">
                                <input 
                                    type="checkbox" 
                                    id="sort-price-asc" 
                                    className="check-box" 
                                    checked={filters.sort === 'price_asc'}
                                    onChange={() => handleSortChange('price_asc')}
                                />
                                Giá (Thấp đến Cao)
                            </label>
                        </li>
                        <li className="check-btn">
                            <label htmlFor="sort-price-desc">
                                <input 
                                    type="checkbox" 
                                    id="sort-price-desc" 
                                    className="check-box" 
                                    checked={filters.sort === 'price_desc'}
                                    onChange={() => handleSortChange('price_desc')}
                                />
                                Giá (Cao đến Thấp)
                            </label>
                        </li>
                    </ul>
                )}
            </div>
        </Styles>
    );
};

export default CourseSort;
