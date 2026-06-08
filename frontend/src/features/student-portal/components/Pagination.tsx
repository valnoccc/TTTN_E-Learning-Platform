import React from 'react';
import { Link } from 'react-router-dom';
import { Styles } from "./styles/pagination";

interface PaginationProps {
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (currentPage === undefined || totalPages === undefined || !onPageChange) {
        return (
            <Styles>
                {/* Pagination */}
                <ul className="pagination-box list-unstyled list-inline">
                    <li className="list-inline-item"><Link to={process.env.PUBLIC_URL + "/"}><i className="las la-angle-double-left"></i></Link></li>
                    <li className="list-inline-item"><Link to={process.env.PUBLIC_URL + "/"}>1</Link></li>
                    <li className="list-inline-item"><Link to={process.env.PUBLIC_URL + "/"}>2</Link></li>
                    <li className="active list-inline-item"><Link to={process.env.PUBLIC_URL + "/"}>3</Link></li>
                    <li className="list-inline-item"><Link to={process.env.PUBLIC_URL + "/"}>...</Link></li>
                    <li className="list-inline-item"><Link to={process.env.PUBLIC_URL + "/"}>13</Link></li>
                    <li className="list-inline-item"><Link to={process.env.PUBLIC_URL + "/"}><i className="las la-angle-double-right"></i></Link></li>
                </ul>
            </Styles>
        );
    }

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <Styles>
            <ul className="pagination-box list-unstyled list-inline">
                <li className="list-inline-item">
                    <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); if (currentPage > 1) onPageChange(currentPage - 1); }}
                        style={currentPage === 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        <i className="las la-angle-double-left"></i>
                    </a>
                </li>
                
                {getPageNumbers().map(page => (
                    <li key={page} className={`list-inline-item ${currentPage === page ? 'active' : ''}`}>
                        <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); onPageChange(page); }}
                        >
                            {page}
                        </a>
                    </li>
                ))}

                <li className="list-inline-item">
                    <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) onPageChange(currentPage + 1); }}
                        style={currentPage === totalPages ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        <i className="las la-angle-double-right"></i>
                    </a>
                </li>
            </ul>
        </Styles>
    );
};

export default Pagination;
