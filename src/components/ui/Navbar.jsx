// src/components/layout/Navbar.jsx

/**
 * Application Navigation Bar component.
 */
function Navbar() {
  return (
    <header className="bg-gray-800 text-white shadow-lg sticky top-0 z-50">
      {' '}
      {/* Sticky Navbar */}
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold hover:text-primary transition-colors">
          {/* Link to top of page or hero section */}
          <a href="#hero">MetaCurtis Premium</a>
        </div>
        <div className="space-x-4">
          {/* TODO: Replace with actual <Link> components if using a router, or implement smooth scroll logic */}
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
}

export default Navbar;
