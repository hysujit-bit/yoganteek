import { useState, useMemo } from 'react';

const isDateValue = (val) => {
  if (typeof val !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}/.test(val);
};

const isNumericValue = (val) => {
  if (typeof val === 'number') return true;
  if (typeof val !== 'string') return false;
  return /^-?\d+(\.\d+)?$/.test(val.trim());
};

const compareValues = (a, b, direction) => {
  if (a == null && b == null) return 0;
  if (a == null) return direction === 'asc' ? 1 : -1;
  if (b == null) return direction === 'asc' ? -1 : 1;

  if (isDateValue(a) && isDateValue(b)) {
    const diff = new Date(a) - new Date(b);
    return direction === 'asc' ? diff : -diff;
  }

  if (isNumericValue(a) && isNumericValue(b)) {
    const diff = parseFloat(a) - parseFloat(b);
    return direction === 'asc' ? diff : -diff;
  }

  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();
  const diff = strA.localeCompare(strB);
  return direction === 'asc' ? diff : -diff;
};

export const useSortableData = (items, initialSort = null) => {
  const [sortConfig, setSortConfig] = useState(initialSort);

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;
    const sorted = [...items].sort((a, b) => {
      return compareValues(a[sortConfig.key], b[sortConfig.key], sortConfig.direction);
    });
    return sorted;
  }, [items, sortConfig]);

  return { sortedItems, requestSort, sortConfig };
};
