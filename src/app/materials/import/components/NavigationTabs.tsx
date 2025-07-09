import { Plus, Clock, Package } from 'lucide-react';
import { TabType } from '@/types';

interface NavigationTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
    const tabs = [
        { id: 'import' as TabType, label: 'Nhập vật tư', icon: Plus },
        { id: 'history' as TabType, label: 'Lịch sử nhập', icon: Clock },
        { id: 'inventory' as TabType, label: 'Tồn kho', icon: Package }
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex space-x-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}