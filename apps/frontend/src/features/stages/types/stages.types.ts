export interface Stage {
  id: string;
  name: string;
  code: string;
  sequenceOrder: number;
  status: 'active' | 'inactive' | 'archived';
  description: string;
}
