'use client';

import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { path: '/train', icon: '🎮', label: '训练' },
  { path: '/homework', icon: '📝', label: '作业' },
  { path: '/rewards', icon: '🎡', label: '抽奖' },
  { path: '/profile', icon: '👤', label: '我的' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <a
          key={item.path}
          onClick={() => router.push(item.path)}
          className={pathname.startsWith(item.path) ? 'active' : ''}
          style={{ cursor: 'pointer' }}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
