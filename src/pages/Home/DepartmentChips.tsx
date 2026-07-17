import { motion } from 'framer-motion';

import type { CatalogFilterItem } from '../../api/catalog';

type DepartmentChipsProps = {
  departments: CatalogFilterItem[];
  selectedDepartmentId: string | null;
  onSelect: (departmentId: string | null) => void;
};

function departmentInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

const DepartmentChips = ({
  departments,
  selectedDepartmentId,
  onSelect,
}: DepartmentChipsProps) => {
  if (departments.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-[16px] py-[20px] sm:px-[24px] sm:py-[24px] lg:px-[32px]">
      <h2 className="mb-[12px] text-lg font-semibold text-gray-900 sm:text-xl">Departamentos</h2>
      <div className="flex gap-[10px] overflow-x-auto pb-[4px] [scrollbar-width:thin]">
        {departments.map((dept) => {
          const selected = selectedDepartmentId === dept.id;
          return (
            <motion.button
              key={dept.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(selected ? null : dept.id)}
              className={`flex shrink-0 items-center gap-[10px] rounded-full border px-[14px] py-[10px] text-left transition-colors ${
                selected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-primary/40 hover:bg-gray-50'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
                aria-hidden
              >
                {departmentInitial(dept.name)}
              </span>
              <span className="whitespace-nowrap text-sm font-medium">{dept.name}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};

export default DepartmentChips;
