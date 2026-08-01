import React, { useState } from 'react';
import { Styles } from '../styles/coursePrice';

const CourseRating = ({ filters, setFilters }: { filters: any, setFilters: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleRatingChange = (ratingValue: string | null) => {
        if (ratingValue !== null && filters.rating === ratingValue) {
            setFilters({ ...filters, rating: null });
        } else {
            setFilters({ ...filters, rating: ratingValue });
        }
    };

    return (
        <Styles>
            <div className="course-price mt-4">
                <h5 
                    className="cursor-pointer flex items-center justify-between hover:text-emerald-500 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ cursor: 'pointer', marginBottom: isOpen ? '20px' : '0' }}
                >
                    Đánh giá
                    <i className={`las ${isOpen ? 'la-angle-up' : 'la-angle-down'} text-xl`}></i>
                </h5>
                
                {isOpen && (
                    <ul className="price-item list-unstyled">
                        <li className="check-btn">
                            <label htmlFor="rating-all">
                                <input 
                                    type="checkbox" 
                                    id="rating-all" 
                                    className="check-box" 
                                    checked={filters.rating === 'all'}
                                    onChange={() => handleRatingChange('all')}
                                />
                                Tất cả
                            </label>
                        </li>
                        <li className="check-btn">
                            <label htmlFor="rating-5">
                                <input 
                                    type="checkbox" 
                                    id="rating-5" 
                                    className="check-box" 
                                    checked={filters.rating === '5'}
                                    onChange={() => handleRatingChange('5')}
                                />
                                <span className="text-warning float-none ml-1 text-sm">
                                    <i className="las la-star"></i><i className="las la-star"></i><i className="las la-star"></i><i className="las la-star"></i><i className="las la-star"></i>
                                </span>
                                <span className="ml-1 text-gray-600" style={{ fontSize: '13px' }}>từ 5 sao</span>
                            </label>
                        </li>
                        <li className="check-btn">
                            <label htmlFor="rating-4">
                                <input 
                                    type="checkbox" 
                                    id="rating-4" 
                                    className="check-box" 
                                    checked={filters.rating === '4'}
                                    onChange={() => handleRatingChange('4')}
                                />
                                <span className="text-warning float-none ml-1 text-sm">
                                    <i className="las la-star"></i><i className="las la-star"></i><i className="las la-star"></i><i className="las la-star"></i><i className="lar la-star"></i>
                                </span>
                                <span className="ml-1 text-gray-600" style={{ fontSize: '13px' }}>từ 4 sao</span>
                            </label>
                        </li>
                        {/* <li className="check-btn">
                            <label htmlFor="rating-3">
                                <input 
                                    type="checkbox" 
                                    id="rating-3" 
                                    className="check-box" 
                                    checked={filters.rating === '3'}
                                    onChange={() => handleRatingChange('3')}
                                />
                                <span className="text-warning float-none ml-1 text-sm">
                                    <i className="las la-star"></i><i className="las la-star"></i><i className="las la-star"></i><i className="lar la-star"></i><i className="lar la-star"></i>
                                </span>
                                <span className="ml-1 text-gray-600" style={{ fontSize: '13px' }}>từ 3 sao</span>
                            </label>
                        </li> */}
                        {/* <li className="check-btn">
                            <label htmlFor="rating-2">
                                <input 
                                    type="checkbox" 
                                    id="rating-2" 
                                    className="check-box" 
                                    checked={filters.rating === '2'}
                                    onChange={() => handleRatingChange('2')}
                                />
                                <span className="text-warning float-none ml-1 text-sm">
                                    <i className="las la-star"></i><i className="las la-star"></i><i className="lar la-star"></i><i className="lar la-star"></i><i className="lar la-star"></i>
                                </span>
                                <span className="ml-1 text-gray-600" style={{ fontSize: '13px' }}>từ 2 sao</span>
                            </label>
                        </li> */}
                        {/* <li className="check-btn">
                            <label htmlFor="rating-1">
                                <input 
                                    type="checkbox" 
                                    id="rating-1" 
                                    className="check-box" 
                                    checked={filters.rating === '1'}
                                    onChange={() => handleRatingChange('1')}
                                />
                                <span className="text-warning float-none ml-1 text-sm">
                                    <i className="las la-star"></i><i className="lar la-star"></i><i className="lar la-star"></i><i className="lar la-star"></i><i className="lar la-star"></i>
                                </span>
                                <span className="ml-1 text-gray-600" style={{ fontSize: '13px' }}>từ 1 sao</span>
                            </label>
                        </li> */}
                    </ul>
                )}
            </div>
        </Styles>
    );
};

export default CourseRating;
