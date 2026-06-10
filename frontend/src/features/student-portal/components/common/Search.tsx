import React, { Component, createRef } from 'react';
import { Styles } from "./styles/search";

class Search extends Component {
    private searchWrapRef = createRef<HTMLDivElement>();
    private searchOverlayRef = createRef<HTMLDivElement>();
    private searchExitRef = createRef<HTMLSpanElement>();

    componentDidMount() {
        const searchTrigger = document.getElementById("search-trigger");
        const searchWrap = this.searchWrapRef.current;
        const searchOverlay = this.searchOverlayRef.current;
        const searchExit = this.searchExitRef.current;

        if (!searchTrigger || !searchWrap || !searchOverlay || !searchExit) {
            return;
        }

        const openSearch = (e: MouseEvent) => {
            e.preventDefault();
            searchWrap.classList.add("active");
        };

        const closeSearch = (e: MouseEvent) => {
            e.preventDefault();
            searchWrap.classList.remove("active");
        };

        searchTrigger.addEventListener("click", openSearch);
        searchOverlay.addEventListener("click", closeSearch);
        searchExit.addEventListener("click", closeSearch);

        (this as any).cleanup = () => {
            searchTrigger.removeEventListener("click", openSearch);
            searchOverlay.removeEventListener("click", closeSearch);
            searchExit.removeEventListener("click", closeSearch);
        };
    }

    componentWillUnmount() {
        if ((this as any).cleanup) {
            (this as any).cleanup();
        }
    }

    render() {
        return (
            <Styles>
                <a href={"/"} className="nav-link nav-search" id="search-trigger">
                    <i className="las la-search"></i>
                </a>
                <div className="search-wrap" id="search-wrap" ref={this.searchWrapRef}>
                    <div className="search-overlay custom-overlay" id="search-overlay" ref={this.searchOverlayRef}></div>
                    <div className="search-inner">
                        <form method="get" className="search-form">
                            <input type="search" name="search" placeholder="Type and hit enter...." />
                            <i className="las la-times close-btn" id="search-close" ref={this.searchExitRef}></i>
                        </form>
                    </div>
                </div>
            </Styles>
        );
    }
}

export default Search;

