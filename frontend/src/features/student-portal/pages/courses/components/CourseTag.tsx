import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Styles } from '../styles/courseTag';
import axiosClient from '../../../../../api/axios';

const CourseTag = () => {
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

    return (
        <Styles>
            {/* Course Tag */}
            <div className="course-tag">
                <h5>Course Tag</h5>
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
