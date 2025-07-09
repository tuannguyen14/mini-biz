import { Plus, Activity, Clock } from 'lucide-react';

interface RecentActivity {
  id: string;
  type: 'product_creation';
  product_name: string;
  quantity?: number;
  created_at: string;
  notes?: string;
}

export default function RecentActivities({ recentActivities }: { recentActivities: RecentActivity[] }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Hoạt Động Gần Đây</h2>
              <p className="text-orange-100 text-sm">Theo dõi lịch sử tạo sản phẩm</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Cập nhật realtime</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="space-y-6">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-3xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      Tạo sản phẩm {activity.product_name}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      {activity.quantity && (
                        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-xl">
                          SL: {activity.quantity}
                        </span>
                      )}
                      {activity.notes && (
                        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-xl max-w-xs truncate">
                          {activity.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium">{formatDate(activity.created_at)}</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold mt-2 bg-blue-100 text-blue-800">
                    Tạo mới
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-gray-400" />
              </div>
              <div className="text-gray-500">
                <p className="text-xl font-bold mb-2">Chưa có hoạt động nào</p>
                <p className="text-sm">Các hoạt động gần đây sẽ hiển thị tại đây</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}