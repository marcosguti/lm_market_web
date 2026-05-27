import { useMemo, useState } from 'react';

import type { CatalogFilterItem } from '../../../api/catalog';

type CatalogSidebarProps = {
  brands: CatalogFilterItem[];
  departments: CatalogFilterItem[];
  selectedBrandId: string | null;
  selectedDepartmentId: string | null;
  onSelectBrand: (id: string | null) => void;
  onSelectDepartment: (id: string | null) => void;
  onClear: () => void;
};

function FilterSection({
  title,
  items,
  selectedId,
  onSelect,
}: {
  title: string;
  items: CatalogFilterItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="mb-[24px] overflow-x-hidden rounded-2xl border border-gray-200/80 bg-white/90 p-[20px] shadow-sm backdrop-blur-sm last:mb-0">
      <h3 className="mb-[10px] text-xs font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar…"
        aria-label={`Buscar en ${title}`}
        className="mb-[8px] w-full rounded-lg border border-gray-200 bg-white px-[10px] py-[6px] text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/30"
      />
      <ul className="m-0 max-h-[300px] list-none overflow-y-auto overflow-x-hidden p-0 pr-[4px] [scrollbar-gutter:stable]">
        <li className="mb-[4px]">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`w-full truncate rounded-lg px-[12px] py-[8px] text-left text-sm transition-colors ${
              selectedId === null
                ? 'bg-primary/15 font-medium text-primary'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Todas
          </button>
        </li>
        {filteredItems.length === 0 ? (
          <li className="px-[12px] py-[8px] text-sm text-gray-400">Sin coincidencias</li>
        ) : (
          filteredItems.map((item) => (
            <li key={item.id} className="mb-[4px] last:mb-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full truncate rounded-lg px-[12px] py-[8px] text-left text-sm transition-colors ${
                  selectedId === item.id
                    ? 'bg-primary/15 font-medium text-primary'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function CatalogSidebar({
  brands,
  departments,
  selectedBrandId,
  selectedDepartmentId,
  onSelectBrand,
  onSelectDepartment,
  onClear,
}: CatalogSidebarProps) {
  const hasFilter = selectedBrandId !== null || selectedDepartmentId !== null;

  return (
    <aside className="w-full shrink-0 lg:w-[260px]">
      <div className="sticky top-[24px]">
        <div className="mb-[16px] flex items-center justify-between gap-[8px]">
          <h2 className="text-base font-semibold text-gray-900">Filtros</h2>
          {hasFilter ? (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-medium text-primary hover:underline"
            >
              Limpiar
            </button>
          ) : null}
        </div>
        <FilterSection
          title="Marcas"
          items={brands}
          selectedId={selectedBrandId}
          onSelect={onSelectBrand}
        />
        <FilterSection
          title="Departamentos"
          items={departments}
          selectedId={selectedDepartmentId}
          onSelect={onSelectDepartment}
        />
      </div>
    </aside>
  );
}
