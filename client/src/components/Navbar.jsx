import React from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, LayoutDashboard, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, loading, logout } = useAuth();

    return (
        <nav className="bg-charcoal-light border-b border-military-gray sticky top-0 z-50">
            <div className="container mx-auto px-4 flex justify-between items-center h-16">
                <Link to="/" className="flex items-center gap-2 text-tactical-yellow font-bold text-xl uppercase tracking-tighter">
                    <Crosshair className="w-8 h-8" />
                    <span>Drop Zone Squads</span>
                </Link>

                <div className="flex items-center gap-4">
                    {loading ? (
                        <div className="text-xs font-black uppercase tracking-widest text-gray-500">
                            Syncing...
                        </div>
                    ) : user ? (
                        <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-gray-400">
                            {user?.isAdmin && (
                                <Link
                                    to="/admin"
                                    className="bg-charcoal-dark hover:bg-military-gray/40 px-3 py-2 rounded-md transition-all border border-military-gray text-gray-300 hover:text-white"
                                >
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest">
                                        <LayoutDashboard className="w-3.5 h-3.5" />
                                        Admin
                                    </span>
                                </Link>
                            )}
                            <Link to="/profile" className="bg-military-gray/30 hover:bg-military-gray/50 px-4 py-2 rounded-md transition-all border border-military-gray">
                                <span className="font-bold text-xs uppercase text-gray-300">{user.username}</span>
                            </Link>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-1 rounded-xl border border-military-gray bg-charcoal-dark/70">
                            <Link
                                to="/auth?mode=login"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all uppercase text-[11px] font-black tracking-widest"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Log In</span>
                            </Link>
                            <Link
                                to="/auth?mode=signup"
                                className="flex items-center gap-2 bg-white text-charcoal-dark font-black px-4 py-2 rounded-lg hover:bg-tactical-yellow transition-all uppercase text-[11px] tracking-widest"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Sign Up</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
