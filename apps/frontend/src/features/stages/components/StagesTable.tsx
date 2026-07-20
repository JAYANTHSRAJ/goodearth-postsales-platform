import React from 'react';
import { Stage } from '../types/stages.types';
import { StageRow } from './StageRow';

interface StagesTableProps {
  stages: Stage[];
}

export const StagesTable: React.FC<StagesTableProps> = ({ stages }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-800">
        <thead className="bg-brand-50/50 dark:bg-brand-950/30">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Stage Details
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Sequence Order
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Description
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-800/40">
          {stages.map((stage) => (
            <StageRow key={stage.id} stage={stage} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default StagesTable;
