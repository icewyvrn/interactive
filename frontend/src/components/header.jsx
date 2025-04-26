import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
// Import as a regular image source, not as a component
import logoImage from '../assets/logo.png';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Remove user from localStorage
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/');
  };

  // Function to check if a nav item is active
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <header className="w-full bg-gradient-to-r from-blue-800 to-blue-600 border-b shadow-md">
      <div className="container mx-auto px-4">
        <div className="h-24 flex items-center justify-between">
          {/* Logo and Title (Left Section) */}
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => navigate('/quarter')}
          >
            {/* Larger Icon Container with proper image tag */}
            <div className="w-18 h-18 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
              <img
                src={logoImage}
                alt="Logo"
                className="w-14 h-14 object-contain"
              />
            </div>

            {/* Title - made larger to match the logo */}
            <div className="text-2xl text-white font-bold">
              Interactive Supplementary Material
            </div>
          </div>

          {/* Navigation Items (Middle Section) */}
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/quarter')}
              className={`text-lg font-medium px-4 py-2 rounded-md transition-colors ${
                isActive('/quarter')
                  ? 'bg-blue-700/50 text-white'
                  : 'text-blue-100 hover:bg-blue-700/30 hover:text-white'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => navigate('/about')}
              className={`text-lg font-medium px-4 py-2 rounded-md transition-colors ${
                isActive('/about')
                  ? 'bg-blue-700/50 text-white'
                  : 'text-blue-100 hover:bg-blue-700/30 hover:text-white'
              }`}
            >
              About
            </button>

            <button
              onClick={() => navigate('/instructions')}
              className={`text-lg font-medium px-4 py-2 rounded-md transition-colors ${
                isActive('/about')
                  ? 'bg-blue-700/50 text-white'
                  : 'text-blue-100 hover:bg-blue-700/30 hover:text-white'
              }`}
            >
              Instructions
            </button>
          </nav>

          {/* Sign Out Button (Right Section) */}
          <Button
            onClick={handleLogout}
            className="bg-white hover:bg-gray-100 text-blue-700 font-medium px-5 py-2.5 rounded-md transition-colors shadow-sm cursor-pointer"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
