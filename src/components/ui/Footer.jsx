// @doctor:4b-disposers
const __doctorDisposers = []; // src/components/layout/Footer.jsx
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
    </footer>);

}

export default Footer; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}