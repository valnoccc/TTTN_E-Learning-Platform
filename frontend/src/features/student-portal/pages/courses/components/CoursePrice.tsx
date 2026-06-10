import React from 'react';
import { Styles } from '../styles/coursePrice';

const CoursePrice = ({ filters, setFilters }: { filters: any, setFilters: any }) => {

    const handlePriceChange = (priceValue: string | null) => {
        setFilters({ ...filters, price: priceValue });
    };

    return (
        <Styles>
            {/* Course Price */}
            <div className="course-price">
                <h5>Course Price</h5>
                <ul className="price-item list-unstyled">
                    <li className="check-btn">
                        <label htmlFor="price-all">
                            <input 
                                type="checkbox" 
                                id="price-all" 
                                className="check-box" 
                                checked={filters.price === null}
                                onChange={() => handlePriceChange(null)}
                            />
                            All
                        </label>
                    </li>
                    <li className="check-btn">
                        <label htmlFor="price-free">
                            <input 
                                type="checkbox" 
                                id="price-free" 
                                className="check-box" 
                                checked={filters.price === 'free'}
                                onChange={() => handlePriceChange('free')}
                            />
                            Free
                        </label>
                    </li>
                </ul>
            </div>
        </Styles>
    );
};

export default CoursePrice;
