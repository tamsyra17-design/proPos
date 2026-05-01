import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertCircle,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { collection, query, limit, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/auth/AuthProvider';
import { Link } from 'react-router-dom';

const data = [
  { name: 'Mon', sales: 4000, profit: 2400 },
  { name: 'Tue', sales: 3000, profit: 1398 },
  { name: 'Wed', sales: 2000, profit: 9800 },
  { name: 'Thu', sales: 2780, profit: 3908 },
  { name: 'Fri', sales: 1890, profit: 4800 },
  { name: 'Sat', sales: 2390, profit: 3800 },
  { name: 'Sun', sales: 3490, profit: 4300 },
];

const StatCard = ({ title, value, subValue, icon: Icon, trend, color }: any) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{title}</p>
    <div className="flex items-end justify-between">
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">{subValue}</p>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          <span>{trend > 0 ? '+' : ''}{trend}%</span>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </div>
      )}
    </div>
  </div>
);

export const Dashboard = () => {
  const { profile } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    if (!profile?.branchId) return;

    // Fetch products summary
    const unsubProducts = onSnapshot(collection(db, 'branches', profile.branchId, 'products'), (snapshot) => {
      setTotalProducts(snapshot.size);
      const lowStock = snapshot.docs.filter(doc => {
        const data = doc.data();
        return (data.stockQuantity || 0) <= (data.alertQuantity || 0);
      });
      setLowStockCount(lowStock.length);
    });

    // Fetch recent sales
    const qSales = query(
      collection(db, 'branches', profile.branchId, 'sales'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProducts();
      unsubSales();
    };
  }, [profile?.branchId]);

  return (
    <div className="space-y-8">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Revenue" 
          value="$0.00" 
          subValue="Real-time sales"
          trend={0}
        />
        <StatCard 
          title="Total Products" 
          value={totalProducts} 
          subValue="In Catalog"
        />
        <StatCard 
          title="Low Stock Items" 
          value={lowStockCount} 
          subValue="Requires action"
          trend={lowStockCount > 5 ? -12 : 5}
        />
        <StatCard 
          title="Total Customers" 
          value="0" 
          subValue="Registered"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Sales Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
            <Link to="/sales" className="text-primary text-xs font-bold hover:underline uppercase tracking-widest">View All Records</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-6 py-3 text-left">Invoice ID</th>
                  <th className="px-6 py-3 text-left">Method</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50 dark:divide-slate-700">
                {sales.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold uppercase text-[10px]">No recent sales recorded</td></tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{sale.invoiceNumber}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 uppercase font-black">{sale.paymentMethod}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-700 dark:text-white">${sale.totalAmount?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Alerts & Goals */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <DollarSign size={18} className="text-primary" />
                POS Quick Access
              </h3>
              <div className="bg-primary/20 px-2 py-1 rounded text-[10px] font-bold tracking-widest text-primary">ONLINE</div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-slate-400">Terminal Ready</span>
                <span className="text-emerald-400">Status 200</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="h-full bg-primary shadow-[0_0_12px_rgba(37,99,235,0.8)]"
                />
              </div>
            </div>
            <Link to="/pos" className="block w-full mt-8 py-4 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all text-center">
              New POS Sale
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-xl shadow-sm transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
              Critical Alerts <span className="text-[10px] text-rose-500 font-bold tracking-widest">REAL-TIME</span>
            </h3>
            {lowStockCount > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-lg flex items-center gap-3">
                  <AlertCircle size={18} className="text-rose-500" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-rose-900 dark:text-rose-100 uppercase leading-none mb-1">Restock Required</p>
                    <p className="text-[9px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-tighter">{lowStockCount} items below threshold</p>
                  </div>
                </div>
                <Link to="/inventory" className="block text-center py-2 text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors">
                  Resolve in Inventory
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 opacity-50">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <TrendingUp size={20} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Stock Healthy</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
