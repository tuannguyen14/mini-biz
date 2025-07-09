import { ImportHistory as ImportHistoryType, PeriodType } from '@/types';

interface ImportHistoryProps {
    importHistory: ImportHistoryType[];
    selectedPeriod: PeriodType;
    onPeriodChange: (period: PeriodType) => void;
}

export function ImportHistory({ importHistory, selectedPeriod, onPeriodChange }: ImportHistoryProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            Lịch sử nhập kho
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Danh sách các phiếu nhập gần đây
                        </p>
                    </div>
                    <select
                        value={selectedPeriod}
                        onChange={(e) => onPeriodChange(e.target.value as PeriodType)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả</option>
                        <option value="today">Hôm nay</option>
                        <option value="week">7 ngày qua</option>
                        <option value="month">30 ngày qua</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Ngày nhập
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Tên vật tư
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Số lượng
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Đơn giá
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Thành tiền
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Ghi chú
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {importHistory.map((import_) => (
                            <tr key={import_.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        {formatDate(import_.import_date)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        {import_.material.name}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Đơn vị: {import_.material.unit}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-900 dark:text-white">
                                        {import_.quantity} {import_.material.unit}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-900 dark:text-white">
                                        {formatCurrency(import_.unit_price)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        {formatCurrency(import_.total_amount)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                                        {import_.notes || '-'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {importHistory.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-slate-500 dark:text-slate-400">
                            Không có dữ liệu trong khoảng thời gian này
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}