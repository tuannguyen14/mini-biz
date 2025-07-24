// components/CustomerSummaryCards.tsx
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react'
import { CustomerDebtDetail } from '@/types/customer'
import { formatCurrency } from '@/lib/utils'

interface CustomerSummaryCardsProps {
  customers: CustomerDebtDetail[]
}

export default function CustomerSummaryCards({ customers }: CustomerSummaryCardsProps) {
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.total_revenue, 0)
  const totalProfit = customers.reduce((sum, customer) => sum + customer.total_profit, 0)
  const totalDebt = customers.reduce((sum, customer) => sum + customer.outstanding_debt, 0)

  const summaryData = [
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      gradient: 'from-blue-500 to-blue-600',
      textColor: 'text-gray-900'
    },
    {
      title: 'Tổng lợi nhuận',
      value: formatCurrency(totalProfit),
      icon: TrendingUp,
      gradient: 'from-green-500 to-green-600',
      textColor: 'text-gray-900'
    },
    {
      title: 'Tổng công nợ',
      value: formatCurrency(totalDebt),
      icon: CreditCard,
      gradient: 'from-red-500 to-red-600',
      textColor: 'text-red-600',
      warning: '⚠ Cần theo dõi'
    },
    {
      title: 'Tổng khách hàng',
      value: customers.length.toString(),
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      textColor: 'text-gray-900'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {summaryData.map((item, index) => (
        <div 
          key={index}
          className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{item.title}</p>
              <p className={`text-2xl font-bold ${item.textColor}`}>{item.value}</p>
              {item.warning && (
                <p className="text-xs text-red-600 mt-1">{item.warning}</p>
              )}
            </div>
            <div className={`p-3 bg-gradient-to-br ${item.gradient} rounded-xl`}>
              <item.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}