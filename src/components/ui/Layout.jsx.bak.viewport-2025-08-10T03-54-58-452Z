// src/components/ui/Layout.jsx
import PropTypes from 'prop-types';

// --- OPTIMIZED Navbar for Full-Viewport Design ---
const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900/70 backdrop-blur-md text-white shadow-lg z-50">
      <nav className="w-full px-6 py-3 flex justify-between items-center">
        <div className="text-xl font-bold hover:text-primary transition-colors">
          <a href="#hero">MetaCurtis Premium</a>
        </div>
        <div className="space-x-6">
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

// --- OPTIMIZED Footer ---
const Footer = () => {
  return (
    <footer className="bg-slate-900/50 text-slate-400 py-4 border-t border-slate-700 relative z-30">
      <div className="w-full text-center text-sm px-6">
        &copy; {new Date().getFullYear()} MetaCurtis Project. All Rights Reserved.
      </div>
    </footer>
  );
};

// --- OPTIMIZED Layout Component for Full-Viewport Hero ---
function Layout({ children }) {
  return (
    <div className="layout-container min-h-screen flex flex-col">
      <Navbar />

      {/* Main content area that accommodates full-viewport Hero */}
      <main className="flex-grow relative">{children}</main>

      <Footer />
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
