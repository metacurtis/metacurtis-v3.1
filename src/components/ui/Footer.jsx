// src/components/layout/Footer.jsx
import React from 'react';

/**
 * Application Footer component.
 */
function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 py-4 mt-auto border-t border-gray-300">
      {' '}
      {/* mt-auto pushes footer down in flex container */}
      <div className="container mx-auto text-center text-sm">
        &copy; {new Date().getFullYear()} MetaCurtis Project. All Rights Reserved.
        {/* Add other footer links or info later */}
      </div>
    </footer>
  );
}

export default Footer;
