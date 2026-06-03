import React, { useEffect } from 'react';
import { Styles } from "./styles/backToTop";

function BackToTop() {
    useEffect(() => {
        const topBtn = document.querySelector<HTMLButtonElement>(".totop-btn");
        if (!topBtn) return;

        const handleScroll = () => {
            if (window.scrollY > 750) {
                topBtn.classList.add("show");
            } else {
                topBtn.classList.remove("show");
            }
        };

        const handleClick = () => smoothScrollBackToTop();
        window.addEventListener("scroll", handleScroll);
        topBtn.addEventListener("click", handleClick);

        function smoothScrollBackToTop() {
            const targetPosition = 0;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            const duration = 750;
            let start: number | null = null;

            window.requestAnimationFrame(step);

            function step(timestamp: number) {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                window.scrollTo(0, easeInOutCubic(progress, startPosition, distance, duration));
                if (progress < duration) window.requestAnimationFrame(step);
            }
        }

        function easeInOutCubic(t: number, b: number, c: number, d: number) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t * t + b;
            t -= 2;
            return c / 2 * (t * t * t + 2) + b;
        };

        return () => {
            window.removeEventListener("scroll", handleScroll);
            topBtn.removeEventListener("click", handleClick);
        };
    }, []);

    return (
        <Styles>
            {/* Back To Top */}
            <button type="button" className="totop-btn">
                <i className="las la-arrow-up"></i>
            </button>
        </Styles>
    )
}

export default BackToTop
