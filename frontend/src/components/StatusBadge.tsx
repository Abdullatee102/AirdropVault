import React from 'react';
import { CATEGORY_LABELS, STATUS_LABELS } from '../config/constants';

interface StatusBadgeProps {
  status: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const meta = STATUS_LABELS[status] || STATUS_LABELS[4];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.bg} ${meta.color} ${meta.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {meta.label}
    </span>
  );
};

interface CategoryBadgeProps {
  category: number;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const label = CATEGORY_LABELS[category] || "Campaign";
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-vault-accent/10 text-vault-accent border border-vault-accent/20">
      {label}
    </span>
  );
};
