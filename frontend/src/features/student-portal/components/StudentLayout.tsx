import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import styled, { css } from 'styled-components';
import HeaderTwo from './HeaderTwo';
import FooterTwo from './FooterTwo';
import PageTransition from '../../../components/PageTransition';
import { GlobalStyle } from './common/styles/global';

const TEMPLATE_SCALE = 0.98;

const TemplateScaleFrame = styled.div<{ $enabled: boolean }>`
  width: 100%;

  ${({ $enabled }) =>
    $enabled &&
    css`
      zoom: ${TEMPLATE_SCALE};

      @supports not (zoom: 1) {
        transform: scale(${TEMPLATE_SCALE});
        transform-origin: top center;
        width: calc(100% / ${TEMPLATE_SCALE});
      }
    `}
`;

const StudentLayout: React.FC = () => {
  const location = useLocation();
  const isLearningPage = location.pathname.includes('/learn/');
  const templateAlignedPages = [
    '/',
    '/home-two',
    '/about',
    '/course-grid',
    '/course-list',
    '/course-details',
    '/login',
    '/register',
    '/registration',
    '/contact',
    '/faq',
    '/blog-grid',
    '/blog',
    '/instructors',
    '/instructor-details',
  ];

  const shouldUseTemplateScale =
    templateAlignedPages.some((path) =>
      path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`),
    );

  return (
    <div className="main-wrapper">
      <TemplateScaleFrame $enabled={shouldUseTemplateScale}>
        {shouldUseTemplateScale && <GlobalStyle />}

        {/* Persistent Header */}
        <HeaderTwo />

        {/* Main Content with Page Transitions */}
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>

        {/* Persistent Footer */}
        {!isLearningPage && <FooterTwo />}
      </TemplateScaleFrame>
    </div>
  );
};

export default StudentLayout;
