import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Package, 
  Download,
  X,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, deleteDoc, updateDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../components/auth/AuthProvider';

export const Products = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    alertQuantity: 5,
    unit: 'pcs',
    imageUrl: ''
  });

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      setCategories(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!profile?.branchId) return;

    setLoading(true);
    const q = query(collection(db, 'branches', profile.branchId, 'products'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to products:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.branchId) return;

    setUploading(true);
    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        const storageRef = ref(storage, `products/${profile.branchId}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      if (editingProduct) {
        await updateDoc(doc(db, 'branches', profile.branchId, 'products', editingProduct.id), {
          ...formData,
          imageUrl: finalImageUrl,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'branches', profile.branchId, 'products'), {
          ...formData,
          imageUrl: finalImageUrl,
          categoryId: formData.categoryId || 'General',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        categoryId: '',
        purchasePrice: 0,
        sellingPrice: 0,
        stockQuantity: 0,
        alertQuantity: 5,
        unit: 'pcs',
        imageUrl: ''
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId || '',
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      alertQuantity: product.alertQuantity,
      unit: product.unit,
      imageUrl: product.imageUrl || ''
    });
    setImagePreview(product.imageUrl || null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!profile?.branchId) return;
    if (!confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, 'branches', profile.branchId, 'products', id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.stockQuantity <= (p.alertQuantity || 0)).length;

  return (
    <div className="space-y-6">
      {lowStockCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-rose-900 dark:text-rose-100 uppercase tracking-widest">Inventory Alert</p>
              <p className="text-xs font-bold text-rose-700/70 dark:text-rose-300/50 uppercase tracking-widest">{lowStockCount} items require immediate restock</p>
            </div>
          </div>
          <button 
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-200 transition-all"
          >
            Review All
          </button>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Filter size={18} />
            Filters
          </button>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setImageFile(null);
              setImagePreview(null);
              setFormData({
                name: '',
                sku: '',
                categoryId: '',
                purchasePrice: 0,
                sellingPrice: 0,
                stockQuantity: 0,
                alertQuantity: 5,
                unit: 'pcs',
                imageUrl: ''
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price (Store/Sell)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Loading products...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium whitespace-pre-wrap">No products found. Match your search or add a new item.</td></tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.stockQuantity <= (product.alertQuantity || 0);
                  return (
                    <tr 
                      key={product.id} 
                      className={`transition-colors ${
                        isLowStock ? 'bg-rose-50/50 dark:bg-rose-900/10 hover:bg-rose-100/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-slate-900 dark:text-white font-bold text-sm tracking-tight">{product.name}</h4>
                              {isLowStock && (
                                <motion.div
                                  animate={{ opacity: [1, 0, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  <AlertTriangle size={14} className="text-rose-500" />
                                </motion.div>
                              )}
                            </div>
                            <p className="text-slate-400 text-xs font-mono">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">
                          {product.categoryId || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-900 dark:text-white font-bold text-sm">${product.sellingPrice}</span>
                          <span className="text-slate-400 text-xs font-medium">Cost: ${product.purchasePrice}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            isLowStock ? 'text-rose-600 font-black' : 'text-slate-900 dark:text-slate-200'
                          }`}>
                            {product.stockQuantity} {product.unit}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Integration */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                <h3 className="text-slate-900 dark:text-white font-bold text-xl uppercase tracking-wider">
                  {editingProduct ? 'Edit Product Item' : 'New Product Item'}
                </h3>
                <button onClick={() => { setShowModal(false); setEditingProduct(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white dark:bg-slate-800">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 flex justify-center">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-600 flex flex-col items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Upload size={24} className="text-slate-300 dark:text-slate-500 mb-1" />
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Photo</span>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">Product Name</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white"
                      placeholder="e.g. Wireless Mouse"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">Unique SKU</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white"
                      placeholder="e.g. MS-001"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col col-span-2">
                    <label className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">Category</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white appearance-none"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      {categories.length === 0 && <option value="General">General</option>}
                    </select>
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">Purchase Price ($)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">Selling Price ($)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({...formData, sellingPrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">Current Stock</label>
                    <input 
                      required
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({...formData, stockQuantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">Low Stock Alert at</label>
                    <input 
                      required
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white"
                      value={formData.alertQuantity}
                      onChange={(e) => setFormData({...formData, alertQuantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setShowModal(false); setEditingProduct(null); }}
                    className="flex-1 py-4 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Processing...' : (editingProduct ? 'Update Product' : 'Save Product')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
