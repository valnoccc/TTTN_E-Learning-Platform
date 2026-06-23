import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HeaderTwo from './HeaderTwo';
import FooterTwo from './FooterTwo';
import PageTransition from '../../../components/PageTransition';

const StudentLayout: React.FC = () => {
  const location = useLocation();
  const isLearningPage = location.pathname.includes('/learn/');

  return (
    <div className="main-wrapper">
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
    </div>
  );
};

export default StudentLayout;
