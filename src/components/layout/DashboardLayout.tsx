import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Truck, 
  PieChart, 
  Settings, 
  LogOut,
  Menu,
  X,
  CreditCard,
  History,
  TrendingDown,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { useAuth } from '../auth/AuthProvider';

interface SidebarItemProps {
  key?: string;
  to: string;
  icon: any;
  label: string;
  active: boolean;
}

const SidebarItem = ({ to, icon: Icon, label, active }: SidebarItemProps) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
    }`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="text-sm tracking-tight">{label}</span>
  </Link>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const location = useLocation();
  const { profile } = useAuth();

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pos', icon: ShoppingCart, label: 'POS System' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/categories', icon: Tag, label: 'Categories' },
    { to: '/inventory', icon: History, label: 'Inventory' },
    { to: '/sales', icon: CreditCard, label: 'Sales History' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/suppliers', icon: Truck, label: 'Suppliers' },
    { to: '/expenses', icon: TrendingDown, label: 'Expenses' },
    { to: '/reports', icon: PieChart, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <aside 
        className={`${
          isOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50">
          <div className={`flex items-center gap-3 ${!isOpen && 'hidden'}`}>
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="font-bold tracking-tight text-xl text-slate-800 dark:text-white uppercase font-sans">PRO-STOCK</span>
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
          <div className={`flex items-center gap-3 p-2 ${!isOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-sm overflow-hidden flex items-center justify-center text-slate-500 font-bold">
              {profile?.name?.[0] || 'U'}
            </div>
            {isOpen && (
              <div className="flex flex-col">
                <span className="text-slate-800 dark:text-white text-xs font-bold">{profile?.name || 'User'}</span>
                <span className="text-slate-400 text-[10px] uppercase tracking-widest">{profile?.role || 'Staff'}</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="w-full mt-2 flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            {isOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">
              {menuItems.find(i => i.to === location.pathname)?.label || 'Page'}
            </h2>
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <select className="text-sm border-none bg-transparent font-medium text-slate-500 focus:ring-0 cursor-pointer">
              <option>All Branches</option>
              <option>{profile?.branchId || 'Default Branch'}</option>
            </select>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer">
              <PieChart size={20} className="text-slate-400 hover:text-slate-600" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            </div>
            <Link to="/pos" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/10 hover:opacity-90 transition-all">
              + New Sale
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* System Status Bar */}
        <footer className="h-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 px-8 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0">
          <div className="flex gap-4">
            <span>DB Status: Connected</span>
            <span>Region: europe-west2</span>
          </div>
          <div className="flex gap-4">
            <span className="text-emerald-500">● System Online</span>
            <span>v1.0.0-stable</span>
          </div>
        </footer>
      </main>
    </div>
  );
};
