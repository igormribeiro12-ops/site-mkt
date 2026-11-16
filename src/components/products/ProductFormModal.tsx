import { useEffect, useState } from 'react';
import { Package, Sparkles } from 'lucide-react';
import type { Product, ProductKind, SegmentId } from '../../types';
import { CATEGORY_SUGGESTIONS } from '../../lib/constants';
import { type Errors, type ProductInput, hasErrors, validateProduct } from '../../lib/validation';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { NumberField, TextAreaField, TextField } from '../ui/Field';
import { Modal } from '../ui/Modal';

const EMPTY: ProductInput = {
  kind: 'produto',
  name: '',
  description: '',
  price: null,
  category: '',
  benefits: '',
  differentials: '',
};

interface ProductFormModalProps {
  open: boolean;
  product: Product | null;
  segment: SegmentId | '';
  onClose: () => void;
  onSave: (data: Omit<Product, 'id' | 'createdAt'>) => void;
}

export function ProductFormModal({ open, product, segment, onClose, onSave }: ProductFormModalProps) {
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(product ? { ...product } : EMPTY);
    setErrors({});
    setSubmitted(false);
  }, [open, product]);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (submitted) setErrors(validateProduct(next));
  };

  const handleSave = () => {
    const found = validateProduct(form);
    setSubmitted(true);
    setErrors(found);
    if (hasErrors(found) || form.price === null) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[role="dialog"] [data-field-error="true"] input, [role="dialog"] [data-field-error="true"] textarea')?.focus();
      });
      return;
    }
    onSave({
      kind: form.kind,
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price,
      category: form.category.trim(),
      benefits: form.benefits.trim(),
      differentials: form.differentials.trim(),
    });
  };

  const suggestions = CATEGORY_SUGGESTIONS[segment || 'outros'];
  const kinds: { id: ProductKind; label: string; icon: typeof Package }[] = [
    { id: 'produto', label: 'Produto', icon: Package },
    { id: 'servico', label: 'Serviço', icon: Sparkles },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={product ? 'Editar item da vitrine' : 'Novo item na vitrine'}
      description="Os campos com * são obrigatórios."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>{product ? 'Salvar alterações' : 'Adicionar à vitrine'}</Button>
        </>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div role="radiogroup" aria-label="Tipo" className="inline-flex rounded-xl bg-slate-100 p-1">
          {kinds.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={form.kind === id}
              onClick={() => set('kind', id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition',
                form.kind === id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px]">
          <TextField
            id="product-name"
            label="Nome"
            required
            data-autofocus
            value={form.name}
            maxLength={60}
            placeholder={form.kind === 'servico' ? 'Ex.: Aula particular de violão' : 'Ex.: Caixa de brigadeiros gourmet'}
            error={errors.name}
            onChange={(e) => set('name', e.target.value)}
          />
          <NumberField
            id="product-price"
            label="Preço"
            required
            prefix="R$"
            placeholder="0,00"
            value={form.price}
            error={errors.price}
            onValueChange={(price) => set('price', price)}
          />
        </div>

        <TextAreaField
          id="product-description"
          label="Descrição"
          required
          rows={2}
          maxLength={280}
          value={form.description}
          placeholder="O que é, como funciona e para quem é."
          error={errors.description}
          onChange={(e) => set('description', e.target.value)}
        />

        <div>
          <TextField
            id="product-category"
            label="Categoria"
            required
            list="product-category-options"
            value={form.category}
            maxLength={40}
            placeholder="Escolha uma sugestão ou escreva"
            error={errors.category}
            onChange={(e) => set('category', e.target.value)}
          />
          <datalist id="product-category-options">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('category', s)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium transition',
                  form.category === s
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-700',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextAreaField
            id="product-benefits"
            label="Benefícios"
            required
            rows={3}
            maxLength={300}
            value={form.benefits}
            placeholder={'Um por linha. Ex.:\nFeito na hora\nEntrega rápida'}
            hint="O que o cliente ganha ao comprar? Escreva um por linha."
            error={errors.benefits}
            onChange={(e) => set('benefits', e.target.value)}
          />
          <TextAreaField
            id="product-differentials"
            label="Diferenciais"
            required
            rows={3}
            maxLength={200}
            value={form.differentials}
            placeholder="Ex.: Receita exclusiva da família."
            hint="Por que escolher este e não o do concorrente?"
            error={errors.differentials}
            onChange={(e) => set('differentials', e.target.value)}
          />
        </div>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
