'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Trang chủ' },
  { href: '/materials/import', label: 'Nhập vật tư' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/sales', label: 'Bán hàng' },
  { href: '/customers', label: 'Khách hàng' },
  { href: '/products/report', label: 'Báo cáo sản phẩm' },
  { href: '/materials/report', label: 'Báo cáo vật tư' }
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-md px-4 py-3 flex space-x-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium ${pathname.startsWith(item.href)
            ? 'text-blue-600'
            : 'text-gray-700 hover:text-blue-500'
            }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
