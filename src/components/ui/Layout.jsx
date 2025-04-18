// src/components/ui/Layout.jsx
// No 'import React' needed if not using React specific APIs other than JSX
import PropTypes from 'prop-types'; // For defining prop types

// --- Placeholder Navbar Component ---
// TODO: Extract into its own file later (e.g., src/components/ui/Navbar.jsx)
const Navbar = () => {
  return (
    // Added backdrop-filter for potential glassmorphism, adjusted background opacity
    <header className="bg-gray-900/70 backdrop-blur-md text-white shadow-lg sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold hover:text-primary transition-colors">
          {/* Link to top or hero section */}
          <a href="#hero">MetaCurtis Premium</a>
        </div>
        <div className="space-x-4">
          {/* Links for scroll navigation */}
          {/* TODO: Replace with <Link> components if using a scroll library later */}
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
// --- End Placeholder Navbar ---

// --- Placeholder Footer Component ---
// TODO: Extract into its own file later (e.g., src/components/ui/Footer.jsx)
const Footer = () => {
  return (
    // Added border color consistent with dark theme base text
    <footer className="bg-slate-900/50 text-slate-400 py-4 mt-auto border-t border-slate-700">
      <div className="container mx-auto text-center text-sm">
        &copy; {new Date().getFullYear()} MetaCurtis Project. All Rights Reserved.
      </div>
    </footer>
  );
};
// --- End Placeholder Footer ---

/**
 * Main application layout component.
 * Provides consistent structure with Navbar and Footer.
 * Renders page-specific content passed as children.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The main content to display within the layout.
 */
function Layout({ children }) {
  return (
    // Use flex column and min-h-screen to ensure footer sticks to bottom
    // Added relative and z-10 to establish stacking context above the z-[-1] canvas
    // Ensure no opaque background is set here if canvas should show through gaps
    <div className="layout-container flex flex-col min-h-screen relative z-10">
      <Navbar />

      {/* Main content area where sections are rendered */}
      {/* 'flex-grow' allows this section to take up available vertical space */}
      {/* Padding moved to sections themselves or kept minimal here */}
      <main className="flex-grow">
        {/* Render child components (the sections passed from App.jsx) */}
        {children}
      </main>

      <Footer />
    </div>
  );
}

// Define expected properties for the Layout component
Layout.propTypes = {
  children: PropTypes.node.isRequired, // Ensures content is passed to the layout
};

// Reminder: Ensure 'prop-types' is installed if using PropTypes: npm install prop-types

export default Layout;
