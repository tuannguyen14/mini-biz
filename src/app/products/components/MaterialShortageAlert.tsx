'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Package, ShoppingCart, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface MaterialShortage {
  material_id: string;
  material_name: string;
  material_unit: string;
  current_stock: number;
  required_stock: number;
  shortage: number;
  affected_products: string[];
}

export default function MaterialShortageAlert() {
  const [shortages, setShortages] = useState<MaterialShortage[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMaterialShortages();
  }, []);

  const checkMaterialShortages = async () => {
    try {
      // Lấy danh sách vật tư và sản phẩm
      const { data: materials } = await supabase
        .from('materials')
        .select('*');

      const { data: products } = await supabase
        .from('products')
        .select('id, name');

      const { data: productMaterials } = await supabase
        .from('product_materials')
        .select('*, product:products(name), material:materials(*)');

      if (!materials || !products || !productMaterials) return;

      const shortageList: MaterialShortage[] = [];

      // Tính toán thiếu hụt cho mỗi vật tư
      materials.forEach(material => {
        const usageInProducts = productMaterials.filter(pm => pm.material_id === material.id);
        
        if (usageInProducts.length > 0) {
          // Giả sử muốn sản xuất ít nhất 1 đơn vị mỗi sản phẩm
          const totalRequired = usageInProducts.reduce((sum, pm) => sum + pm.quantity_required, 0);
          
          if (material.current_stock < totalRequired) {
            const shortage = totalRequired - material.current_stock;
            const affectedProducts = usageInProducts.map(pm => pm.product?.name || '').filter(name => name);
            
            shortageList.push({
              material_id: material.id,
              material_name: material.name,
              material_unit: material.unit,
              current_stock: material.current_stock,
              required_stock: totalRequired,
              shortage,
              affected_products: affectedProducts
            });
          }
        }
      });

      setShortages(shortageList);
      setIsVisible(shortageList.length > 0);
    } catch (error) {
      console.error('Error checking material shortages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isVisible || shortages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl shadow-2xl border border-red-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cảnh báo thiếu vật tư</h3>
                <p className="text-red-100 text-sm">{shortages.length} vật tư thiếu hụt</p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all duration-300"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-white">
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {shortages.map((shortage) => (
              <div key={shortage.material_id} className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl border-2 border-red-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800">{shortage.material_name}</h4>
                      <p className="text-sm text-red-600">Đơn vị: {shortage.material_unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Thiếu {shortage.shortage}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center bg-white/80 p-2 rounded-lg">
                    <p className="text-xs text-gray-600">Tồn kho</p>
                    <p className="font-bold text-gray-800">{shortage.current_stock}</p>
                  </div>
                  <div className="text-center bg-white/80 p-2 rounded-lg">
                    <p className="text-xs text-gray-600">Cần có</p>
                    <p className="font-bold text-red-600">{shortage.required_stock}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-2">Ảnh hưởng đến sản phẩm:</p>
                  <div className="flex flex-wrap gap-1">
                    {shortage.affected_products.map((product, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span><Link href="/materials/import">Đi đến trang nhập vật tư</Link></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}