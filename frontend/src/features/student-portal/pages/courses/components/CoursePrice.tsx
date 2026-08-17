import React, { useState, useEffect } from 'react';
import { Styles } from '../styles/coursePrice';

const CoursePrice = ({ filters, setFilters }: { filters: any, setFilters: any }) => {
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        if (!filters.price || ['all', 'free', '500000-', '500000-1000000'].includes(filters.price)) {
            setMinPrice('');
            setMaxPrice('');
        }
    }, [filters.price]);

    const handlePriceChange = (priceValue: string | null) => {
        if (priceValue !== null && filters.price === priceValue) {
            setFilters({ ...filters, price: null });
        } else {
            setFilters({ ...filters, price: priceValue });
        }
    };

    const handleApplyRange = () => {
        if (!minPrice && !maxPrice) {
            setFilters({ ...filters, price: null });
            return;
        }
        setFilters({ ...filters, price: `${minPrice}-${maxPrice}` });
    };

    return (
        <Styles>
            {/* Course Price */}
            <div className="course-price">
                <h5
                    className="cursor-pointer flex items-center justify-between hover:text-emerald-500 transition-colors whitespace-nowrap"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ cursor: 'pointer', marginBottom: isOpen ? '20px' : '0' }}
                >
                    <span className="title-text">Giá khóa học</span>
                    {/* <i className={`las ${isOpen ? 'la-angle-up' : 'la-angle-down'} text-xl`}></i> */}
                </h5>

                {isOpen && (
                    <div className="price-content">
                        <ul className="price-item list-unstyled">
                            <li className="check-btn">
                                <label htmlFor="price-all">
                                    <input
                                        type="checkbox"
                                        id="price-all"
                                        className="check-box"
                                        checked={filters.price === 'all'}
                                        onChange={() => handlePriceChange('all')}
                                    />
                                    Tất cả
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
                                    Miễn phí
                                </label>
                            </li>
                            {/* <li className="check-btn">
                                <label htmlFor="price-500k">
                                    <input 
                                        type="checkbox" 
                                        id="price-500k" 
                                        className="check-box" 
                                        checked={filters.price === '500000-'}
                                        onChange={() => handlePriceChange('500000-')}
                                    />
                                    Từ 500k
                                </label>
                            </li> */}

                            {/* <li className="check-btn">
                                <label htmlFor="price-500k-1m">
                                    <input 
                                        type="checkbox" 
                                        id="price-500k-1m" 
                                        className="check-box" 
                                        checked={filters.price === '500000-1000000'}
                                        onChange={() => handlePriceChange('500000-1000000')}
                                    />
                                    500k - 1 Triệu
                                </label>
                            </li> */}
                        </ul>

                        <div className="mt-3 border-t border-dashed pt-3">
                            <p className="text-sm text-gray-500 mb-2 font-medium">Khoảng giá (VNĐ)</p>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="number"
                                    placeholder="Từ"
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-green-500 transition-colors"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="number"
                                    placeholder="Đến"
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-green-500 transition-colors"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleApplyRange}
                                    className="flex-1 bg-[#1A8A59] text-white text-sm py-1.5 rounded hover:bg-[#136642] transition-colors"
                                >
                                    Áp dụng
                                </button>
                                {(minPrice || maxPrice || (filters.price && filters.price.includes('-'))) && (
                                    <button
                                        onClick={() => {
                                            setMinPrice('');
                                            setMaxPrice('');
                                            if (filters.price && filters.price.includes('-')) {
                                                setFilters({ ...filters, price: null });
                                            }
                                        }}
                                        className="px-3 bg-gray-100 text-gray-600 text-sm py-1.5 rounded hover:bg-gray-200 transition-colors"
                                        title="Xóa bộ lọc giá"
                                    >
                                        Xóa
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Styles>
    );
};

export default CoursePrice;
