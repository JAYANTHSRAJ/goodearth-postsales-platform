import { create } from 'zustand';
import { clientService } from '../services/client.service';

export interface ClientUnit {
  id: string; // Buyer ID
  workflowId: string;
  unitName: string;
  projectName?: string;
  projectCode?: string;
  location?: string;
  status?: string;
  kycStatus: string; // "NOT_STARTED", "DRAFT", "SUBMITTED", "VERIFIED"
  kycLocked: boolean;
  isKycVerified: boolean;
  hasPendingModificationRequest: boolean;
  kycApplicationId?: string;
}

interface UnitState {
  units: ClientUnit[];
  activeUnit: ClientUnit | null;
  setUnits: (units: ClientUnit[]) => void;
  setActiveUnit: (unit: ClientUnit) => void;
  clearActiveUnit: () => void;
}

const LAST_UNIT_KEY = 'goodearth_last_selected_unit_id';

export const useUnitStore = create<UnitState>((set) => ({
  units: [],
  activeUnit: null,
  setUnits: (units) => {
    const lastId = localStorage.getItem(LAST_UNIT_KEY);
    let selected: ClientUnit | null = null;
    if (lastId) {
      selected = units.find((u) => u.id === lastId || u.workflowId === lastId) || null;
    }
    if (!selected && units.length > 0) {
      selected = units[0];
    }
    set({ units, activeUnit: selected });
    if (selected) {
      localStorage.setItem(LAST_UNIT_KEY, selected.id);
    }
  },
  setActiveUnit: (unit) => {
    localStorage.setItem(LAST_UNIT_KEY, unit.id);
    set({ activeUnit: unit });
    clientService.setActiveUnit(unit.id).catch((e) => console.error('Failed to sync active unit to backend', e));
  },
  clearActiveUnit: () => {
    localStorage.removeItem(LAST_UNIT_KEY);
    set({ activeUnit: null, units: [] });
  },
}));
