import { ShoppingCart, DollarSign, Package2, Box } from 'lucide-react';
import { Statistics } from '@/types';

interface StatisticsCardsProps {
    statistics: Statistics;
    totalMaterials: number;
}

export function StatisticsCards({ statistics, totalMaterials }: StatisticsCardsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const cards = [
        {
            icon: ShoppingCart,
            value: statistics.totalImports,
            label: 'Tổng phiếu nhập',
            subtitle: `+${statistics.todayImports} hôm nay`,
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400'
        },
        {
            icon: DollarSign,
            value: formatCurrency(statistics.totalValue).replace('₫', ''),
            label: 'Tổng giá trị',
            subtitle: 'Trong kỳ này',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            iconColor: 'text-green-600 dark:text-green-400'
        },
        {
            icon: Package2,
            value: statistics.uniqueMaterials,
            label: 'Loại vật tư',
            subtitle: 'Đã nhập trong kỳ',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
            iconColor: 'text-purple-600 dark:text-purple-400'
        },
        {
            icon: Box,
            value: totalMaterials,
            label: 'Tổng tồn kho',
            subtitle: 'Các loại vật tư',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
            iconColor: 'text-orange-600 dark:text-orange-400'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 ${card.bgColor} rounded-xl`}>
                            <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                        </div>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            {card.value}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {card.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                        {card.subtitle}
                    </p>
                </div>
            ))}
        </div>
    );
}