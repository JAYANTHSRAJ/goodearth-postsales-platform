import { create } from 'zustand';
import { clientService } from '../services/client.service';

export interface ClientUnit {
  id: string; // Buyer ID / Unit Identifier
  workflowId?: string;
  bookingId?: string;
  dealId?: string;
  unitId?: string;
  projectId?: string;
  unitName: string;
  projectName?: string;
  projectCode?: string;
  zohoDealName?: string;
  zohoDealId?: string;
  location?: string;
  status?: string;
  constructionStage?: string;
  possessionDate?: string;
  thumbnail?: string;
}

interface UnitState {
  units: ClientUnit[];
  activeUnit: ClientUnit | null;
  hasSelectedUnit: boolean;
  setUnits: (units: ClientUnit[]) => void;
  setActiveUnit: (unit: ClientUnit) => void;
  clearActiveUnit: () => void;
}

const LAST_UNIT_KEY = 'goodearth_last_selected_unit_id';
const ACTIVE_UNIT_CACHE = 'goodearth_active_unit_data';

export const useUnitStore = create<UnitState>((set) => {
  let initialActive: ClientUnit | null = null;
  try {
    const cached = localStorage.getItem(ACTIVE_UNIT_CACHE);
    if (cached) {
      initialActive = JSON.parse(cached);
    }
  } catch (e) {
    // Ignore parse error
  }

  return {
    units: [],
    activeUnit: initialActive,
    hasSelectedUnit: !!initialActive,
    setUnits: (units) => {
      const lastId = localStorage.getItem(LAST_UNIT_KEY);
      let selected: ClientUnit | null = null;
      if (lastId) {
        selected = units.find((u) => u.id === lastId || u.workflowId === lastId || u.unitName === lastId || u.bookingId === lastId) || null;
      }
      if (!selected && units.length > 0) {
        selected = units[0];
      }
      const finalUnit = selected || initialActive;
      set({ units, activeUnit: finalUnit, hasSelectedUnit: !!finalUnit });
      if (selected) {
        localStorage.setItem(LAST_UNIT_KEY, selected.id);
        localStorage.setItem(ACTIVE_UNIT_CACHE, JSON.stringify(selected));
      }
    },
    setActiveUnit: (unit) => {
      localStorage.setItem(LAST_UNIT_KEY, unit.id);
      localStorage.setItem(ACTIVE_UNIT_CACHE, JSON.stringify(unit));
      set({ activeUnit: unit, hasSelectedUnit: true });
      clientService.setActiveUnit(unit.id).catch((e) => console.error('Failed to sync active unit to backend', e));
    },
    clearActiveUnit: () => {
      localStorage.removeItem(LAST_UNIT_KEY);
      localStorage.removeItem(ACTIVE_UNIT_CACHE);
      set({ activeUnit: null, units: [], hasSelectedUnit: false });
    },
  };
});
