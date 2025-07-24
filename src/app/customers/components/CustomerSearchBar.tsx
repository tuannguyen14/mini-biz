// components/CustomerSearchBar.tsx
import { Search, Plus } from 'lucide-react'

interface CustomerSearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onAddCustomer: () => void
}

export default function CustomerSearchBar({ 
  searchTerm, 
  onSearchChange, 
  onAddCustomer 
}: CustomerSearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
            className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <button
        onClick={onAddCustomer}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <Plus className="h-5 w-5" />
        Thêm khách hàng
      </button>
    </div>
  )
}