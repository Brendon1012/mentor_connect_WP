import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import ServerStatusBanner from '../components/layout/ServerStatusBanner.jsx';

export default function PublicLayout() {
  return (
    <div className="public-layout">
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <ServerStatusBanner />
      <main id="main" className="public-main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
