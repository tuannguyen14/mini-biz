import { Trash2 } from 'lucide-react';

interface DeleteConfirmationProps {
  show: boolean;
  product: {
    id: string;
    name: string;
  } | null;
  onCancel: () => void;
  onConfirm: (productId: string) => void;
}

export default function DeleteConfirmation({ 
  show, 
  product, 
  onCancel, 
  onConfirm 
}: DeleteConfirmationProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Xác nhận xóa sản phẩm</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-800 font-medium mb-2">
              Bạn có chắc chắn muốn xóa sản phẩm:
            </p>
            <p className="text-xl font-bold text-red-600">
              {product?.name}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Hành động này không thể hoàn tác và sẽ xóa cả công thức sản phẩm.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-2xl font-medium transition-all duration-300"
            >
              Hủy
            </button>
            <button
              onClick={() => product && onConfirm(product.id)}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-2xl font-medium transition-all duration-300"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}