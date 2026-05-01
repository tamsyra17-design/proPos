import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  CreditCard, 
  Banknote,
  Smartphone,
  Delete,
  X,
  Package,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/auth/AuthProvider';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export const POS = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile'>('Cash');
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!profile?.branchId) return;
      const q = query(collection(db, 'branches', profile.branchId, 'products'));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    };
    fetchProducts();
  }, [profile?.branchId]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.sellingPrice, 
        quantity: 1,
        stock: product.stockQuantity
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
      const invoiceNumber = `INV-${Date.now()}`;
      const saleData = {
        invoiceNumber,
        totalAmount: total,
        paidAmount: total,
        paymentMethod,
        branchId: profile.branchId,
        cashierId: profile.uid,
        createdAt: serverTimestamp(),
        status: 'paid'
      };

      const saleRef = await addDoc(collection(db, 'branches', profile.branchId, 'sales'), saleData);

      // Add items and update stock
      for (const item of cart) {
        await addDoc(collection(db, 'branches', profile.branchId, 'sales', saleRef.id, 'items'), {
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity
        });

        // Update Stock
        const productRef = doc(db, 'branches', profile.branchId, 'products', item.id);
        await updateDoc(productRef, {
          stockQuantity: increment(-item.quantity)
        });

        // Log transaction
        await addDoc(collection(db, 'branches', profile.branchId, 'stockLogs'), {
          productId: item.id,
          productName: item.name,
          type: 'sale',
          quantity: item.quantity,
          previousStock: item.stock,
          newStock: item.stock - item.quantity,
          reason: `Sale ${invoiceNumber}`,
          createdAt: serverTimestamp(),
          createdBy: profile.name || 'System'
        });
      }

      setLastInvoice({ ...saleData, items: cart });
      setCart([]);
      setShowInvoice(true);
      // Refresh products to reflect new stock
      const q = query(collection(db, 'branches', profile.branchId, 'products'));
      const querySnapshot = await getDocs(q);
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 antialiased">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search products by name or SKU..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
            <UserPlus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredProducts.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                disabled={product.stockQuantity <= 0}
                className={`flex flex-col text-left bg-white p-4 rounded-xl border transition-all ${
                  product.stockQuantity <= 0 
                  ? 'border-slate-100 opacity-60 grayscale cursor-not-allowed' 
                  : 'border-slate-100 hover:border-blue-500 hover:shadow-md shadow-sm'
                }`}
              >
                <div className="w-full aspect-square bg-slate-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-slate-50">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={40} className="text-slate-200" />
                  )}
                </div>
                <h4 className="text-slate-800 font-bold text-sm tracking-tight line-clamp-1">{product.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-blue-600 font-bold tracking-tighter">${product.sellingPrice}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    product.stockQuantity < 10 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {product.stockQuantity} qty
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart & Checkout Area */}
      <div className="w-96 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-600" />
              Checkout Order
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-black tracking-widest uppercase">
              {cart.length} ITEMS
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <ShoppingCart size={48} className="mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Terminal Standby</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                  <Package size={20} className="text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-800 text-sm font-bold truncate tracking-tight">{item.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-blue-600 font-bold text-sm tracking-tighter">${item.price}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-slate-800 font-bold text-sm w-4 text-center font-mono">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-slate-300 hover:text-rose-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-slate-900">${total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <span>Taxes & Fees</span>
              <span className="text-slate-900">$0.00</span>
            </div>
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-900 font-black text-xs uppercase tracking-widest">Grand Total</span>
              <span className="text-2xl font-black text-blue-600 tracking-tighter">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6">
            {(['Cash', 'Card', 'Mobile'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-1 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === method 
                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600'
                }`}
              >
                {method === 'Cash' && <Banknote size={16} />}
                {method === 'Card' && <CreditCard size={16} />}
                {method === 'Mobile' && <Smartphone size={16} />}
                <span className="text-[9px] font-black uppercase tracking-widest">{method}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full mt-6 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? 'Finalizing...' : 'Pay & Print'}
          </button>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-slate-900">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-10 max-w-md w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden relative border border-slate-100"
            >
              <button 
                onClick={() => setShowInvoice(false)}
                className="absolute right-6 top-6 text-slate-300 hover:text-slate-900"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-12">
                  <CreditCard size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">Receipt Generated</h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">{lastInvoice?.invoiceNumber}</p>
              </div>

              <div className="space-y-4 mb-10">
                {lastInvoice?.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">{item.quantity}x <span className="text-slate-900 font-bold">{item.name}</span></span>
                    <span className="font-black text-slate-900 tracking-tighter">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-3">
                <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                  <span>Method</span>
                  <span className="text-slate-900">{lastInvoice?.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-slate-900 tracking-tighter">
                  <span>Total</span>
                  <span className="text-blue-600">${lastInvoice?.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all"
                >
                  Print
                </button>
                <button 
                  onClick={() => setShowInvoice(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
