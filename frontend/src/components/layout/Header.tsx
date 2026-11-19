import { Menu, Bell, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/overview':  'Overview',
  '/assistant': 'AI Assistant',
  '/planner':   'Study Planner',
  '/quizzes':   'Quizzes',
  '/tasks':     'My Tasks',
  '/activity':  'Activity History',
  '/settings':  'Settings',
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? 'Smart Study Agent';
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-3">
      {/* Left side – menu button on mobile and title */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-200 transition"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 truncate">{title}</h1>
      </div>

      {/* Right side – optional date (hidden on small screens) and user menu */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-xs text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </div>
        <button
          className="p-2 rounded-md text-gray-600 hover:bg-gray-200 transition"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-800 hidden md:inline-block max-w-[120px] truncate">
            {user?.name || 'User'}
          </span>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-md text-gray-600 hover:text-white hover:bg-red-600 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
