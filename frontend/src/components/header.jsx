import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove user from localStorage
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/');
  };

  return (
    <header className="w-full bg-emerald-700 border-b">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="text-xl text-white font-bold">
            Interactive Learning System
          </div>
          <Button
            onClick={handleLogout}
            className="bg-white hover:bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-md transition-colors shadow-sm cursor-pointer"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
