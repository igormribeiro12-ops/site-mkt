import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Audience,
  BrandIdentity,
  CalendarEntry,
  Campaign,
  CompanyInfo,
  FinancePlan,
  MarketingPlan,
  Product,
  Project,
} from '../types';
import { createEmptyProject } from '../lib/defaults';
import { createId } from '../lib/id';
import {
  STORAGE_KEY,
  clearProject,
  isStorageAvailable,
  loadProject,
  normalizeProject,
  saveProject,
} from '../lib/storage';

interface ProjectContextValue {
  project: Project;
  hasStarted: boolean;
  lastSavedAt: Date | null;
  storageOk: boolean;
  startProject: () => void;
  updateCompany: (patch: Partial<CompanyInfo>) => void;
  updateBrand: (patch: Partial<BrandIdentity>) => void;
  updateAudience: (patch: Partial<Audience>) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  updateMarketing: (patch: Partial<MarketingPlan>) => void;
  addCalendarEntry: (entry: Omit<CalendarEntry, 'id'>) => void;
  updateCalendarEntry: (id: string, patch: Partial<CalendarEntry>) => void;
  removeCalendarEntry: (id: string) => void;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => Campaign;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  removeCampaign: (id: string) => void;
  duplicateCampaign: (id: string) => void;
  updateFinance: (patch: Partial<FinancePlan>) => void;
  /** Força a gravação imediata. Retorna false se o navegador bloquear. */
  saveNow: () => boolean;
  resetProject: () => void;
  replaceProject: (project: Project) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>(() => loadProject() ?? createEmptyProject());
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() =>
    project.updatedAt ? new Date(project.updatedAt) : null,
  );
  const [storageOk, setStorageOk] = useState(() => isStorageAvailable());
  // Evita regravar o que acabou de ser lido do armazenamento.
  const skipNextSave = useRef(true);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (!project.createdAt) return;
    const ok = saveProject(project);
    setStorageOk(ok);
    if (ok) setLastSavedAt(new Date());
  }, [project]);

  // Mantém várias abas do mesmo navegador sincronizadas.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      let next = createEmptyProject();
      if (event.newValue) {
        try {
          next = normalizeProject(JSON.parse(event.newValue));
        } catch {
          return;
        }
      }
      skipNextSave.current = true;
      setProject(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const mutate = useCallback((fn: (p: Project) => Project) => {
    setProject((prev) => {
      const now = new Date().toISOString();
      const next = fn(prev);
      return { ...next, createdAt: next.createdAt ?? now, updatedAt: now };
    });
  }, []);

  const startProject = useCallback(() => mutate((p) => p), [mutate]);

  const updateCompany = useCallback(
    (patch: Partial<CompanyInfo>) => mutate((p) => ({ ...p, company: { ...p.company, ...patch } })),
    [mutate],
  );
  const updateBrand = useCallback(
    (patch: Partial<BrandIdentity>) => mutate((p) => ({ ...p, brand: { ...p.brand, ...patch } })),
    [mutate],
  );
  const updateAudience = useCallback(
    (patch: Partial<Audience>) => mutate((p) => ({ ...p, audience: { ...p.audience, ...patch } })),
    [mutate],
  );

  const addProduct = useCallback(
    (data: Omit<Product, 'id' | 'createdAt'>) => {
      const product: Product = { ...data, id: createId('prod'), createdAt: new Date().toISOString() };
      mutate((p) => ({ ...p, products: [...p.products, product] }));
      return product;
    },
    [mutate],
  );
  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) =>
      mutate((p) => ({
        ...p,
        products: p.products.map((item) => (item.id === id ? { ...item, ...patch, id } : item)),
      })),
    [mutate],
  );
  const removeProduct = useCallback(
    (id: string) =>
      mutate((p) => ({
        ...p,
        products: p.products.filter((item) => item.id !== id),
        // Campanhas que divulgavam o produto passam a divulgar a empresa em geral.
        campaigns: p.campaigns.map((c) => (c.productId === id ? { ...c, productId: '' } : c)),
      })),
    [mutate],
  );

  const updateMarketing = useCallback(
    (patch: Partial<MarketingPlan>) =>
      mutate((p) => ({ ...p, marketing: { ...p.marketing, ...patch } })),
    [mutate],
  );
  const addCalendarEntry = useCallback(
    (entry: Omit<CalendarEntry, 'id'>) =>
      mutate((p) => ({
        ...p,
        marketing: {
          ...p.marketing,
          calendar: [...p.marketing.calendar, { ...entry, id: createId('cal') }],
        },
      })),
    [mutate],
  );
  const updateCalendarEntry = useCallback(
    (id: string, patch: Partial<CalendarEntry>) =>
      mutate((p) => ({
        ...p,
        marketing: {
          ...p.marketing,
          calendar: p.marketing.calendar.map((e) => (e.id === id ? { ...e, ...patch, id } : e)),
        },
      })),
    [mutate],
  );
  const removeCalendarEntry = useCallback(
    (id: string) =>
      mutate((p) => ({
        ...p,
        marketing: { ...p.marketing, calendar: p.marketing.calendar.filter((e) => e.id !== id) },
      })),
    [mutate],
  );

  const addCampaign = useCallback(
    (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const campaign: Campaign = { ...data, id: createId('camp'), createdAt: now, updatedAt: now };
      mutate((p) => ({ ...p, campaigns: [...p.campaigns, campaign] }));
      return campaign;
    },
    [mutate],
  );
  const updateCampaign = useCallback(
    (id: string, patch: Partial<Campaign>) =>
      mutate((p) => ({
        ...p,
        campaigns: p.campaigns.map((c) =>
          c.id === id ? { ...c, ...patch, id, updatedAt: new Date().toISOString() } : c,
        ),
      })),
    [mutate],
  );
  const removeCampaign = useCallback(
    (id: string) => mutate((p) => ({ ...p, campaigns: p.campaigns.filter((c) => c.id !== id) })),
    [mutate],
  );
  const duplicateCampaign = useCallback(
    (id: string) =>
      mutate((p) => {
        const original = p.campaigns.find((c) => c.id === id);
        if (!original) return p;
        const now = new Date().toISOString();
        const copy: Campaign = {
          ...original,
          id: createId('camp'),
          name: `${original.name} (cópia)`,
          createdAt: now,
          updatedAt: now,
        };
        return { ...p, campaigns: [...p.campaigns, copy] };
      }),
    [mutate],
  );

  const updateFinance = useCallback(
    (patch: Partial<FinancePlan>) => mutate((p) => ({ ...p, finance: { ...p.finance, ...patch } })),
    [mutate],
  );

  const projectRef = useRef(project);
  projectRef.current = project;

  const saveNow = useCallback(() => {
    const current = projectRef.current;
    const toSave = current.createdAt
      ? current
      : { ...current, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const ok = saveProject(toSave);
    setStorageOk(ok);
    if (ok) setLastSavedAt(new Date());
    return ok;
  }, []);

  const resetProject = useCallback(() => {
    clearProject();
    skipNextSave.current = true;
    setProject(createEmptyProject());
    setLastSavedAt(null);
  }, []);

  const replaceProject = useCallback((next: Project) => {
    setProject({ ...next, updatedAt: new Date().toISOString() });
  }, []);

  const value = useMemo<ProjectContextValue>(
    () => ({
      project,
      hasStarted: project.createdAt !== null,
      lastSavedAt,
      storageOk,
      startProject,
      updateCompany,
      updateBrand,
      updateAudience,
      addProduct,
      updateProduct,
      removeProduct,
      updateMarketing,
      addCalendarEntry,
      updateCalendarEntry,
      removeCalendarEntry,
      addCampaign,
      updateCampaign,
      removeCampaign,
      duplicateCampaign,
      updateFinance,
      saveNow,
      resetProject,
      replaceProject,
    }),
    [
      project,
      lastSavedAt,
      storageOk,
      startProject,
      updateCompany,
      updateBrand,
      updateAudience,
      addProduct,
      updateProduct,
      removeProduct,
      updateMarketing,
      addCalendarEntry,
      updateCalendarEntry,
      removeCalendarEntry,
      addCampaign,
      updateCampaign,
      removeCampaign,
      duplicateCampaign,
      updateFinance,
      saveNow,
      resetProject,
      replaceProject,
    ],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject deve ser usado dentro de <ProjectProvider>.');
  return ctx;
}
