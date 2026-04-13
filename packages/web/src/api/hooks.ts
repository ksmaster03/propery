import { useQuery } from '@tanstack/react-query';
import api from './client';

// === React Query hooks เรียก API ทั้งหมด ===

// Dashboard KPI
export interface DashboardKpi {
  totalUnits: number;
  leasedUnits: number;
  vacantUnits: number;
  reservedUnits: number;
  totalAreaSqm: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

export function useDashboardKpi(airportId?: number) {
  return useQuery({
    queryKey: ['dashboard', 'kpi', airportId],
    queryFn: async (): Promise<DashboardKpi> => {
      const { data } = await api.get('/dashboard/kpi', {
        params: airportId ? { airportId } : undefined,
      });
      return data.data;
    },
  });
}

// Dashboard — สัญญาใกล้หมดอายุ
export interface ExpiringContract {
  contractNo: string;
  partnerName: string;
  shopName: string;
  unitCode: string;
  unitName: string;
  airport: string;
  endDate: string;
  daysLeft: number;
  urgency: 'urgent' | 'warning' | 'normal';
}

export function useExpiringContracts(days = 90) {
  return useQuery({
    queryKey: ['dashboard', 'expiring', days],
    queryFn: async (): Promise<ExpiringContract[]> => {
      const { data } = await api.get('/dashboard/expiring-contracts', {
        params: { days },
      });
      return data.data;
    },
  });
}

// Dashboard — กราฟรายรับรายเดือน
export interface RevenueChartPoint {
  month: string;
  monthIndex: number;
  actual: number;
  forecast: number;
}

export function useRevenueChart(year?: number) {
  return useQuery({
    queryKey: ['dashboard', 'revenue-chart', year],
    queryFn: async (): Promise<RevenueChartPoint[]> => {
      const { data } = await api.get('/dashboard/revenue-chart', {
        params: year ? { year } : undefined,
      });
      return data.data;
    },
  });
}
