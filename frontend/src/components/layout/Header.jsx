import { FiMenu } from 'react-icons/fi';
import NotificationBell from '../common/NotificationBell';
import { Link } from 'react-router-dom';

const Header = ({ user, onMenuClick, title = "Panel de Control" }) => {
    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all md:hidden"
                >
                    <FiMenu size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell />
                <Link
                    to="/profile"
                    className="hidden sm:flex items-center gap-3 text-right pl-4 border-l border-slate-200 hover:opacity-85 transition-opacity duration-200"
                    title="Ir a mi perfil"
                >
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.firstName || 'Admin'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-white hover:scale-105 transition-transform">
                        {user?.firstName?.[0] || 'A'}
                    </div>
                </Link>
            </div>
        </header>
    );
};

export default Header;
