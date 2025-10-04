"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FiltersBarClientProps {
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

export function FiltersBarClient({ categories, materials, currentCategory, currentMaterial, currentMin, currentMax, globalMin, globalMax, currentSort }: FiltersBarClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [minVal, setMinVal] = useState<number>(currentMin);
  const [maxVal, setMaxVal] = useState<number>(currentMax);
  const [pendingCategory, setPendingCategory] = useState<string>(currentCategory);
  const [pendingMaterial, setPendingMaterial] = useState<string>(currentMaterial);

  const slugify = useCallback((v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), []);

  function pushUpdated(opts: { category?: string; material?: string; min?: number; max?: number; resetPage?: boolean }) {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (opts.category !== undefined) { if (opts.category) params.set('category', opts.category); else params.delete('category'); }
    if (opts.material !== undefined) { if (opts.material) params.set('material', opts.material); else params.delete('material'); }
    if (typeof opts.min === 'number') { if (opts.min > globalMin) params.set('minPrice', String(opts.min)); else params.delete('minPrice'); }
    if (typeof opts.max === 'number') { if (opts.max < globalMax) params.set('maxPrice', String(opts.max)); else params.delete('maxPrice'); }
    if (opts.resetPage) params.delete('page');
    if (currentSort) params.set('sort', currentSort); else params.delete('sort');
    const qs = params.toString();
    router.push(qs ? `/public/products?${qs}` : '/public/products');
  }

  useEffect(() => {
    const t = setTimeout(() => {
      pushUpdated({ min: minVal, max: maxVal, category: pendingCategory, material: pendingMaterial });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minVal, maxVal]);

  function toggleCategory(cat: string) {
    const slug = slugify(cat);
    const newCat = pendingCategory === slug ? '' : slug;
    setPendingCategory(newCat);
    pushUpdated({ category: newCat, material: pendingMaterial, min: minVal, max: maxVal, resetPage: true });
  }
  function toggleMaterial(mat: string) {
    const slug = slugify(mat);
    const newMat = pendingMaterial === slug ? '' : slug;
    setPendingMaterial(newMat);
    pushUpdated({ category: pendingCategory, material: newMat, min: minVal, max: maxVal, resetPage: true });
  }

  const handleMinChange = (v: number) => { setMinVal(Math.min(Math.max(globalMin, v), maxVal)); };
  const handleMaxChange = (v: number) => { setMaxVal(Math.max(Math.min(globalMax, v), minVal)); };

  return (
    <div className="flex flex-col gap-4 border rounded-md px-4 py-4 bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categoría</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, index) => {
            const slug = slugify(cat);
            const active = slug === pendingCategory;
            return (
              <button
                key={`${slug}-${index}`} // Use index to ensure uniqueness
                onClick={() => toggleCategory(cat)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${active ? 'bg-muted/90 text-foreground border-muted-foreground/40 shadow-inner' : 'hover:bg-muted/40 hover:border-muted'}`}
              >{cat}</button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Material</span>
        <div className="flex flex-wrap gap-2">
          {materials.map((mat, index) => {
            const slug = slugify(mat);
            const active = slug === pendingMaterial;
            return (
              <button
                key={`${slug}-${index}`} // Use index to ensure uniqueness
                onClick={() => toggleMaterial(mat)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${active ? 'bg-muted/90 text-foreground border-muted-foreground/40 shadow-inner' : 'hover:bg-muted/40 hover:border-muted'}`}
              >{mat}</button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Precio</span>
        <div className="flex flex-col gap-2">
          <div className="relative h-6 flex items-center">
            <input
              type="range"
              min={globalMin}
              max={globalMax}
              value={minVal}
              onChange={e => handleMinChange(Number(e.target.value))}
              className="absolute w-full pointer-events-auto accent-foreground/70 [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20"
            />
            <input
              type="range"
              min={globalMin}
              max={globalMax}
              value={maxVal}
              onChange={e => handleMaxChange(Number(e.target.value))}
              className="absolute w-full pointer-events-auto accent-foreground/70 [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30"
            />
            <div className="absolute h-1 w-full bg-muted rounded overflow-hidden">
              <div
                className="h-1 bg-primary/50 dark:bg-primary/60 rounded transition-all"
                style={{
                  left: `${((minVal - globalMin) / (globalMax - globalMin)) * 100}%`,
                  width: `${((maxVal - minVal) / (globalMax - globalMin)) * 100}%`
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Min:</span>
              <input
                type="number"
                className="w-20 rounded border bg-background/70 px-2 py-1 text-xs"
                value={minVal}
                min={globalMin}
                max={maxVal}
                onChange={e => handleMinChange(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Max:</span>
              <input
                type="number"
                className="w-20 rounded border bg-background/70 px-2 py-1 text-xs"
                value={maxVal}
                min={minVal}
                max={globalMax}
                onChange={e => handleMaxChange(Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setMinVal(globalMin);
                setMaxVal(globalMax);
                pushUpdated({ min: globalMin, max: globalMax, category: pendingCategory, material: pendingMaterial, resetPage: true });
              }}
              className="ml-auto text-[11px] px-2 py-1 rounded-md border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >Limpiar filtros</button>
          </div>
        </div>
      </div>
    </div>
  );
}
