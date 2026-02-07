import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Edit, Save } from 'lucide-react';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const loadPackages = async () => {
      const res = await api.get('/packages');
      setPackages(res.data);
    };
    loadPackages();
  }, []);

  const handleEditClick = (pkg) => {
    setEditingId(pkg.id);
    setEditForm(pkg);
  };

  const handleSave = async () => {
    try {
      await api.put(`/packages/${editingId}`, {
        name: editForm.name,
        price: parseFloat(editForm.price),
        discount_price: editForm.discount_price ? parseFloat(editForm.discount_price) : null,
        features: editForm.features,
        is_highlighted: editForm.is_highlighted
      });
      alert("Package Updated!");
      setEditingId(null);
      // Reload page or update state locally
      window.location.reload();
    } catch (e) {
      alert("Error updating package");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Manage Packages</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`bg-gray-800 p-6 rounded-xl border ${pkg.is_highlighted ? 'border-cyan-500' : 'border-gray-700'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
              {editingId !== pkg.id && (
                <button onClick={() => handleEditClick(pkg)} className="text-gray-400 hover:text-white">
                  <Edit size={18} />
                </button>
              )}
            </div>

            {editingId === pkg.id ? (
              <div className="space-y-3">
                <input 
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                  placeholder="Price"
                />
                 <input 
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  value={editForm.discount_price || ''}
                  onChange={(e) => setEditForm({...editForm, discount_price: e.target.value})}
                  placeholder="Discount Price (Optional)"
                />
                <button onClick={handleSave} className="w-full bg-green-600 text-white p-2 rounded flex justify-center items-center">
                  <Save size={18} className="mr-2" /> Save Changes
                </button>
              </div>
            ) : (
              <div>
                <p className="text-3xl font-bold text-cyan-400">Rs. {pkg.price}</p>
                {pkg.discount_price && <p className="text-sm text-gray-400 line-through">Rs. {pkg.discount_price}</p>}
                <ul className="mt-4 space-y-2 text-gray-300 text-sm">
                  {pkg.features.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Packages;