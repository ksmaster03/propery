import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';

// === Master Data types + hooks ===

export type MasterEntity = 'organizations' | 'zone-types' | 'business-categories' | 'payment-methods' | 'document-types' | 'departments';

// Generic list hook — ใช้ร่วมกันได้ทุก master data entity
export function useMaster<T = any>(entity: MasterEntity) {
  return useQuery({
    queryKey: ['master', entity],
    queryFn: async (): Promise<T[]> => {
      const { data } = await api.get(`/master/${entity}`);
      return data.data || [];
    },
    staleTime: 60_000,
  });
}

// Generic create
export function useCreateMaster<T = any>(entity: MasterEntity) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<T>) => {
      const { data } = await api.post(`/master/${entity}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master', entity] }),
  });
}

// Generic update
export function useUpdateMaster<T = any>(entity: MasterEntity) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<T> & { id: number }) => {
      const { data } = await api.put(`/master/${entity}/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master', entity] }),
  });
}

// Generic delete (soft)
export function useDeleteMaster(entity: MasterEntity) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/master/${entity}/${id}`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master', entity] }),
  });
}

// === Entity-specific types ===
export interface Organization {
  id: number;
  orgCode: string;
  nameTh: string;
  nameEn?: string | null;
  shortNameTh?: string | null;
  shortNameEn?: string | null;
  taxId?: string | null;
  addressTh?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  treasuryPct?: number;
  welfareFundPct?: number;
  revolvingFundPct?: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface ZoneType {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string | null;
  icon?: string | null;
  color?: string | null;
  defaultRate?: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface BusinessCategory {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface PaymentMethod {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string | null;
  icon?: string | null;
  requiresRef: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface DocumentType {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string | null;
  required: boolean;
  forPartner: boolean;
  forJuristic: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface Department {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string | null;
  parentId?: number | null;
  sortOrder: number;
  isActive: boolean;
}

// === Floor Plan SVG hooks ===
export interface FloorplanSvg {
  id: number;
  airportId: number;
  buildingCode: string | null;
  floorCode: string | null;
  name: string;
  svgContent: string;
  canvasWidth: number;
  canvasHeight: number;
  uploadedAt: string;
  isActive: boolean;
}

export function useFloorplan(airportId?: number, buildingCode?: string, floorCode?: string) {
  return useQuery({
    queryKey: ['floorplans', airportId, buildingCode, floorCode],
    queryFn: async (): Promise<FloorplanSvg[]> => {
      const { data } = await api.get('/floorplans', {
        params: { airportId, buildingCode, floorCode },
      });
      return data.data || [];
    },
    enabled: !!airportId,
  });
}

export function useSaveFloorplan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FloorplanSvg>) => {
      const { data } = await api.post('/floorplans', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['floorplans'] }),
  });
}
