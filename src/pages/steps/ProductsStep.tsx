import { useState } from 'react';
import { PackageOpen, Plus, Store } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { StepFooter, StepHeader, useStepForm } from '../../components/layout/StepLayout';
import { ProductCard } from '../../components/products/ProductCard';
import { ProductFormModal } from '../../components/products/ProductFormModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Callout, EmptyState } from '../../components/ui/Feedback';
import { ErrorText } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, pluralize } from '../../lib/format';
import type { Product } from '../../types';

export function ProductsStep() {
  const { project, addProduct, updateProduct, removeProduct } = useProject();
  const toast = useToast();
  const { errors, allErrors, showErrors, submit } = useStepForm('produtos');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const products = project.products;
  const usedInCampaigns = deleting ? project.campaigns.filter((c) => c.productId === deleting.id).length : 0;

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const averagePrice = products.length ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;

  return (
    <div>
      <StepHeader stepId="produtos" />

      <Card className="animate-fade-up overflow-hidden p-0 sm:p-0" data-field-error={errors.products ? 'true' : undefined}>
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo brand={project.brand} companyName={project.company.name} size="sm" />
            <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden />
            <div className="hidden sm:block">
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                <Store className="size-4 text-violet-600" aria-hidden />
                Vitrine digital
              </p>
              <p className="text-xs text-slate-500">
                {products.length
                  ? `${pluralize(products.length, 'item', 'itens')} · preço médio ${formatCurrency(averagePrice)}`
                  : 'Nenhum item cadastrado'}
              </p>
            </div>
          </div>
          <Button onClick={openNew} icon={<Plus className="size-4" aria-hidden />}>
            Adicionar produto ou serviço
          </Button>
        </div>

        <div className="p-5 sm:p-6">
          {products.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="Sua vitrine está vazia"
              description="Cadastre os produtos ou serviços que a sua empresa vai vender. Eles aparecem aqui como numa loja on-line."
              action={
                <Button onClick={openNew} icon={<Plus className="size-4" aria-hidden />}>
                  Cadastrar o primeiro item
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  brand={project.brand}
                  className="animate-fade-up"
                  onEdit={() => {
                    setEditing(product);
                    setFormOpen(true);
                  }}
                  onDelete={() => setDeleting(product)}
                />
              ))}
              <button
                type="button"
                onClick={openNew}
                className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-500 transition hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-700"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-100">
                  <Plus className="size-5" aria-hidden />
                </span>
                Adicionar outro item
              </button>
            </div>
          )}
          <ErrorText>{errors.products}</ErrorText>
        </div>
      </Card>

      <Callout className="mt-6">
        Na hora de vender, o cliente compra <strong>benefícios</strong>, não características. "Bolo de chocolate" é uma
        característica; "a sobremesa que deixa sua festa inesquecível" é um benefício.
      </Callout>

      <ProductFormModal
        open={formOpen}
        product={editing}
        segment={project.company.segment}
        onClose={() => setFormOpen(false)}
        onSave={(data) => {
          if (editing) {
            updateProduct(editing.id, data);
            toast.success(`"${data.name}" foi atualizado.`);
          } else {
            addProduct(data);
            toast.success(`"${data.name}" foi adicionado à vitrine.`);
          }
          setFormOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir este item?"
        confirmLabel="Excluir"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            removeProduct(deleting.id);
            toast.info(`"${deleting.name}" foi removido da vitrine.`);
          }
          setDeleting(null);
        }}
        message={
          <>
            <p>
              <strong className="text-slate-900">{deleting?.name}</strong> será removido da vitrine.
            </p>
            {usedInCampaigns > 0 && (
              <p>
                {usedInCampaigns === 1
                  ? '1 campanha divulga este item e passará'
                  : `${usedInCampaigns} campanhas divulgam este item e passarão`}{' '}
                a divulgar a empresa em geral.
              </p>
            )}
          </>
        }
      />

      <StepFooter stepId="produtos" onContinue={submit} missingCount={Object.keys(allErrors).length} showErrors={showErrors} />
    </div>
  );
}
