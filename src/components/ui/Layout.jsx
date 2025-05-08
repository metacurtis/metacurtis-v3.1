// src/components/ui/Layout.jsx
import PropTypes from 'prop-types';

// --- ORIGINAL Tailwind-styled Navbar ---
const Navbar = () => {
  return (
    <header className="bg-gray-900/70 backdrop-blur-md text-white shadow-lg sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold hover:text-primary transition-colors">
          <a href="#hero">MetaCurtis Premium</a>
        </div>
        <div className="space-x-4">
          <a href="#hero" className="hover:text-primary transition-colors">
            Home
          </a>
          <a href="#about" className="hover:text-primary transition-colors">
            About
          </a>
          <a href="#features" className="hover:text-primary transition-colors">
            Features
          </a>
          <a href="#contact" className="hover:text-primary transition-colors">
            Contact
          </a>
        </div>
      </nav>
    </header>
  );
};

// --- ORIGINAL Tailwind-styled Footer ---
const Footer = () => {
  return (
    <footer className="bg-slate-900/50 text-slate-400 py-4 mt-auto border-t border-slate-700">
      <div className="container mx-auto text-center text-sm">
        &copy; {new Date().getFullYear()} MetaCurtis Project. All Rights Reserved.
      </div>
    </footer>
  );
};

// --- Main Layout Component ---
function Layout({ children }) {
  return (
    <div
      // Final working classes using absolute positioning fix
      className="layout-container absolute inset-0 flex flex-col z-10 overflow-hidden"
    >
      <Navbar />
      <main
        // Main grows and handles its own scroll
        className="flex-grow overflow-y-auto"
        // Add padding back if needed, e.g., "px-4 py-8" or similar
      >
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
