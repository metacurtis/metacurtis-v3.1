// src/components/ui/Layout.jsx (Definitive)
import React from 'react';
import PropTypes from 'prop-types';
import Navbar from './Navbar'; // Assumes Navbar.jsx is here
import Footer from './Footer'; // Assumes Footer.jsx is here

/**
 * Main application layout component.
 */
function Layout({ children }) {
  return (
    // Ensure this container is transparent and stretches vertically
    // Removed relative/z-index here to simplify stacking, relying on document flow
    <div className="layout-container flex flex-col min-h-screen bg-transparent">
      {/* Navbar is sticky with its own z-index */}
      <Navbar />

      {/* Main content area grows to push footer down */}
      {/* Added items-center and spacing for section layout */}
      <main className="flex-grow container mx-auto px-4 py-20 md:py-28 lg:py-32 flex flex-col items-center space-y-20 md:space-y-28 lg:space-y-36">
        {children}
      </main>

      <Footer />
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
