'use client';

import { useState, useEffect } from 'react';
import type { Child } from '@/types';

interface Props {
  parentId: string;
  selectedChildId?: string;
  onSelect: (child: Child) => void;
}

export default function ChildSelector({ parentId, selectedChildId, onSelect }: Props) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parentId) return;
    fetch(`/api/children?parent_id=${parentId}`)
      .then((r) => r.json())
      .then((data) => {
        setChildren(data.children || []);
        if (data.children?.length > 0 && !selectedChildId) {
          onSelect(data.children[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [parentId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '1rem' }}>加载中...</div>;
  if (children.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
      {children.map((child) => (
        <button
          key={child.id}
          onClick={() => onSelect(child)}
          className={child.id === selectedChildId ? 'btn-primary' : 'card'}
          style={{
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontSize: '0.85rem',
            border: child.id === selectedChildId ? 'none' : '2px solid var(--border-default)',
          }}
        >
          {child.gender === 'girl' ? '👧' : '👦'} {child.name}
          {child.streak_days > 0 && ` 🔥${child.streak_days}`}
        </button>
      ))}
    </div>
  );
}
