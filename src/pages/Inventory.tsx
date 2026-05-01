import React, { useState, useEffect } from 'react';
import { 
  Package, 
  History, 
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertCircle,
  Filter,
  CheckCircle2,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  orderBy, 
  onSnapshot,
  increment,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/auth/AuthProvider';

interface StockLog {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'sale' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: any;
  createdBy: string;
}

export const Inventory = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustData, setAdjustData] = useState({
    type: 'in' as 'in' | 'out',
    quantity: 1,
    reason: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!profile?.branchId) return;

    // Listen to products
    const qProducts = query(collection(db, 'branches', profile.branchId, 'products'), orderBy('name', 'asc'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Listen to recent stock logs
    const qLogs = query(
      collection(db, 'branches', profile.branchId, 'stockLogs'), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setStockLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StockLog[]);
    });

    return () => {
      unsubProducts();
      unsubLogs();
    };
  }, [profile?.branchId]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.branchId || !selectedProduct || isProcessing) return;

    setIsProcessing(true);
    try {
      const qChange = adjustData.type === 'in' ? adjustData.quantity : -adjustData.quantity;
      const productRef = doc(db, 'branches', profile.branchId, 'products', selectedProduct.id);
      
      const newStock = (selectedProduct.stockQuantity || 0) + qChange;

      // Update product stock
      await updateDoc(productRef, {
        stockQuantity: increment(qChange),
        updatedAt: serverTimestamp()
      });

      // Log transaction
      await addDoc(collection(db, 'branches', profile.branchId, 'stockLogs'), {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        type: adjustData.type,
        quantity: adjustData.quantity,
        previousStock: selectedProduct.stockQuantity || 0,
        newStock: newStock,
        reason: adjustData.reason || (adjustData.type === 'in' ? 'Manual Restock' : 'Inventory Adjustment'),
        createdAt: serverTimestamp(),
        createdBy: profile.name || 'System'
      });

      setShowAdjustModal(false);
      setSelectedProduct(null);
      setAdjustData({ type: 'in', quantity: 1, reason: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to adjust stock");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = products.filter(p => (p.stockQuantity || 0) <= (p.alertQuantity || 0)).length;
  const outOfStockCount = products.filter(p => (p.stockQuantity || 0) <= 0).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="geometric-card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-blue-500" size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Items</span>
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white font-mono">{products.length}</div>
        </div>
        <div className="geometric-card p-6 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-rose-500" size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock</span>
          </div>
          <div className="text-3xl font-black text-rose-500 font-mono">{lowStockCount}</div>
        </div>
        <div className="geometric-card p-6 border-l-4 border-l-slate-800 dark:border-l-slate-500">
          <div className="flex items-center gap-3 mb-2">
            <X className="text-slate-800 dark:text-slate-500" size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Out of Stock</span>
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white font-mono">{outOfStockCount}</div>
        </div>
        <div className="geometric-card p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="text-emerald-500" size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Healthy Stock</span>
          </div>
          <div className="text-3xl font-black text-emerald-500 font-mono">{products.length - lowStockCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Package size={16} /> Inventory Status
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text"
                placeholder="Find product..."
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all w-48 focus:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="geometric-card overflow-hidden">
            <table className="w-full text-left geometric-table">
              <thead>
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Alert</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400 text-xs font-bold uppercase animate-pulse">Scanning Warehouse...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400 text-xs font-bold uppercase">No items found</td></tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLow = (p.stockQuantity || 0) <= (p.alertQuantity || 0);
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${isLow ? 'bg-rose-50/20' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <Package size={18} className="text-slate-300" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{p.name}</p>
                              <p className="text-[10px] font-mono text-slate-400">{p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <span className={`text-sm font-black font-mono ${isLow ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                               {p.stockQuantity || 0}
                             </span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase">{p.unit}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.alertQuantity || 0} min</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => { setSelectedProduct(p); setShowAdjustModal(true); }}
                            className="bg-primary text-white p-2 rounded-lg hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                          >
                            <Plus size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent History */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <History size={16} /> Recent Activity
          </h3>
          <div className="space-y-3">
            {stockLogs.length === 0 ? (
              <div className="p-8 text-center geometric-card border-dashed">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Archive is empty</p>
              </div>
            ) : (
              stockLogs.map((log) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id} 
                  className="geometric-card p-4 flex gap-4 items-start relative group"
                >
                  <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                    log.type === 'in' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                    log.type === 'out' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' :
                    'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  }`}>
                    {log.type === 'in' ? <ArrowUpCircle size={16} /> : 
                     log.type === 'out' ? <ArrowDownCircle size={16} /> : 
                     <History size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-black text-slate-800 dark:text-white uppercase truncate pr-2">{log.productName}</p>
                      <p className={`text-[10px] font-black font-mono ${
                        log.type === 'in' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {log.type === 'in' ? '+' : '-'}{log.quantity}
                      </p>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-2 italic">"{log.reason}"</p>
                    <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 dark:border-slate-700/50 pt-2">
                       <span>{log.createdBy}</span>
                       <span>{log.createdAt?.toDate?.()?.toLocaleTimeString() || 'Just now'}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Adjust Modal */}
      <AnimatePresence>
        {showAdjustModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdjustModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
              
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">Adjustment</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedProduct?.name}</p>
                </div>
                <button onClick={() => setShowAdjustModal(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAdjustStock} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setAdjustData({ ...adjustData, type: 'in' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      adjustData.type === 'in' 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' 
                      : 'border-slate-50 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <ArrowUpCircle size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Stock In</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAdjustData({ ...adjustData, type: 'out' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      adjustData.type === 'out' 
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600' 
                      : 'border-slate-50 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <ArrowDownCircle size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Stock Out</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Quantity to change</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-lg font-black font-mono outline-none focus:ring-2 focus:ring-primary transition-all"
                    value={adjustData.quantity}
                    onChange={(e) => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value) || 0 })}
                  />
                  <div className="flex justify-between px-1 pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current: {selectedProduct?.stockQuantity || 0}</span>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                      New Total: {adjustData.type === 'in' ? (selectedProduct?.stockQuantity || 0) + adjustData.quantity : (selectedProduct?.stockQuantity || 0) - adjustData.quantity}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Reason (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Restock from supplier, damaged goods..."
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProcessing ? 'Recording...' : 'Confirm Transaction'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
