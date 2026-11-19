import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  ClipboardList,
  CheckSquare,
  History,
  Settings,
  GraduationCap,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/overview',   icon: LayoutDashboard, label: 'Overview' },
  { to: '/assistant',  icon: MessageSquare,   label: 'AI Assistant' },
  { to: '/planner',    icon: BookOpen,        label: 'Study Planner' },
  { to: '/quizzes',    icon: ClipboardList,   label: 'Quizzes' },
  { to: '/tasks',      icon: CheckSquare,     label: 'My Tasks' },
  { to: '/activity',   icon: History,         label: 'Activity History' },
  { to: '/settings',   icon: Settings,        label: 'Settings' },
];

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-100 text-gray-900">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          onClick={() => { navigate('/overview'); onClose(); }}
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm">Smart Study</div>
            <div className="text-[11px] text-indigo-200 font-normal">AI Agent</div>
          </div>
        </button>
        {/* Mobile close */}
        <button
          className="lg:hidden p-1 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 transition"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                isActive
                  ? 'bg-indigo-200 text-indigo-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile & logout */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate text-gray-800">{user?.name || 'User'}</div>
            <div className="text-[10px] text-indigo-600/70 truncate">{user?.email || ''}</div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Log Out"
          className="p-1.5 rounded-lg text-indigo-600 hover:text-white hover:bg-indigo-600 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 text-[11px] text-indigo-600/50 text-center">
        Smart Study Agent v1.0
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col h-screen sticky top-0">{sidebarContent}</aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-60 bg-gray-100 h-full z-50">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
