import React, { useState } from 'react';
import { Styles } from '../styles/courseSearch';

const CourseSearch = ({ filters, setFilters }: { filters: any, setFilters: any }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters({ ...filters, search: searchTerm });
    };

    return (
        <Styles>
            {/* Course Search */}
            <div className="course-search">
                <h5>Search Course</h5>
                <form onSubmit={handleSearch}>
                    <input 
                        type="text" 
                        name="search" 
                        placeholder="Search Here" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit"><i className="las la-search"></i></button>
                </form>
            </div>
        </Styles>
    );
};

export default CourseSearch;
