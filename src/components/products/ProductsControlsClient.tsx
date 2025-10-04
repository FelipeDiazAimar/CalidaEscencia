"use client";
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiltersBarClient } from '@/components/products/FiltersBarClient';

interface ProductsControlsClientProps {
  categories: string[];
  materials: string[];
  currentCategory: string;
  currentMaterial: string;
  currentMin: number;
  currentMax: number;
  globalMin: number;
  globalMax: number;
  currentSort: string;
}

const sortOptions: { key: string; label: string }[] = [
  { key: '', label: 'Por defecto' },
  { key: 'nombre', label: 'Nombre (A-Z)' },
  { key: 'nombre-desc', label: 'Nombre (Z-A)' },
  { key: 'nuevo', label: 'Más nuevos' },
  { key: 'antiguo', label: 'Más antiguos' },
  { key: 'precio', label: 'Precio (menor)' },
  { key: 'precio-desc', label: 'Precio (mayor)' },
];

export function ProductsControlsClient(props: ProductsControlsClientProps) {
  const { categories, materials, currentCategory, currentMaterial, currentMin, currentMax, globalMin, globalMax, currentSort } = props;
  const [openFilters, setOpenFilters] = useState(false);
  const [openSort, setOpenSort] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleFilters = () => setOpenFilters(o => !o);
  const toggleSort = () => setOpenSort(o => !o);

  const buildHref = useCallback((opts: { sort?: string | null }) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    // preserve category/material + price range if not default
    if (currentCategory) params.set('category', currentCategory); else params.delete('category');
    if (currentMaterial) params.set('material', currentMaterial); else params.delete('material');
    if (currentMin > globalMin) params.set('minPrice', String(currentMin)); else params.delete('minPrice');
    if (currentMax < globalMax) params.set('maxPrice', String(currentMax)); else params.delete('maxPrice');
    if (opts.sort) params.set('sort', opts.sort); else params.delete('sort');
    params.delete('page'); // reset page whenever changing sort
    const qs = params.toString();
    return qs ? `/public/products?${qs}` : '/public/products';
  }, [searchParams, currentCategory, currentMaterial, currentMin, currentMax, globalMin, globalMax]);

  const applySort = (key: string) => {
    const href = buildHref({ sort: key || null });
    router.push(href);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          type="button"
          onClick={toggleFilters}
          className={`inline-flex items-center gap-2 px-6 py-3 text-sm rounded-full border font-semibold tracking-wide transition-colors shadow-sm ${openFilters ? 'bg-muted/90 border-muted-foreground/40 shadow-inner' : 'hover:bg-muted/40 hover:border-muted'}`}
          aria-expanded={openFilters}
          aria-controls="filters-panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M3 4h18"/><path d="M6 12h12"/><path d="M10 20h4"/></svg>
          <span>Filtros</span>
        </button>
        <button
          type="button"
          onClick={toggleSort}
          className={`inline-flex items-center gap-2 px-6 py-3 text-sm rounded-full border font-semibold tracking-wide transition-colors shadow-sm ${openSort ? 'bg-muted/90 border-muted-foreground/40 shadow-inner' : 'hover:bg-muted/40 hover:border-muted'}`}
          aria-expanded={openSort}
          aria-controls="sort-panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><path d="M3 17l3 3 3-3"/><path d="M6 18V4"/></svg>
          <span>Ordenar</span>
        </button>
      </div>
      {openFilters && (
        <div id="filters-panel" className="border rounded-md bg-background/60 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-top-2">
          <FiltersBarClient
            categories={categories}
            materials={materials}
            currentCategory={currentCategory}
            currentMaterial={currentMaterial}
            currentMin={currentMin}
            currentMax={currentMax}
            globalMin={globalMin}
            globalMax={globalMax}
            currentSort={currentSort}
          />
        </div>
      )}
      {openSort && (
        <div id="sort-panel" className="border rounded-md bg-background/60 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-top-2 flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ordenar por</span>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map(opt => {
              const active = opt.key === currentSort;
              return (
                <button
                  key={opt.key || 'default'}
                  type="button"
                  onClick={() => applySort(opt.key)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${active ? 'bg-muted/90 text-foreground border-muted-foreground/40 shadow-inner' : 'hover:bg-muted/40 hover:border-muted'}`}
                >{opt.label}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
