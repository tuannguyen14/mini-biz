'use client';

import { useState, useCallback } from 'react';
import { ImportHistory, Statistics, PeriodType } from '@/types';
import { getImportHistory } from '../actions/imports';

export function useImportHistory() {
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalImports: 0,
    totalValue: 0,
    uniqueMaterials: 0,
    todayImports: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchImportHistory = useCallback(async (period: PeriodType = 'all') => {
    setLoading(true);
    try {
      const { imports, statistics: newStats } = await getImportHistory(period);
      setImportHistory(imports);
      setStatistics(newStats);
    } catch (error) {
      console.error('Error fetching import history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    importHistory,
    statistics,
    loading,
    fetchImportHistory
  };
}