import { useEffect, useRef, useState } from 'react';
import { Copy, Eraser, Layers, Pencil, Save, SquarePen, Trash2, WandSparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PlatformIcon } from '../../components/brand/PlatformIcon';
import { StepFooter, StepHeader, focusFirstError, useStepForm } from '../../components/layout/StepLayout';
import { PostPreview } from '../../components/posts/PostPreview';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { chipClass } from '../../components/ui/Chips';
import { Callout, EmptyState } from '../../components/ui/Feedback';
import { ErrorText, FieldGroup, SelectField, TextAreaField, TextField } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/Modal';
import { RadioCard } from '../../components/ui/RadioCard';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { ART_STYLES, CHANNELS, CTA_OPTIONS, getChannel } from '../../lib/constants';
import { emptyCampaignDraft } from '../../lib/defaults';
import { formatCurrency } from '../../lib/format';
import { buildAidaText } from '../../lib/postText';
import { loadCampaignDraft, saveCampaignDraft } from '../../lib/storage';
import { type Errors, hasErrors, validateCampaign } from '../../lib/validation';
import { cn } from '../../lib/cn';
import type { ArtStyleId, Campaign, CampaignDraft, ChannelId } from '../../types';

export function PublicationsStep() {
  const { project, addCampaign, updateCampaign, removeCampaign, duplicateCampaign } = useProject();
  const toast = useToast();
  const { errors: stepErrors, allErrors, showErrors, submit } = useStepForm('publicacoes');
  const [draft, setDraft] = useState<CampaignDraft>(() => loadCampaignDraft());
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [deleting, setDeleting] = useState<Campaign | null>(null);
  const [confirmAida, setConfirmAida] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const { campaigns, products, company, brand } = project;
  const editing = draft.editingId ? campaigns.find((c) => c.id === draft.editingId) : undefined;
  const product = products.find((p) => p.id === draft.productId);
  const channel = getChannel(draft.platform)!;

  // O rascunho fica salvo no navegador, para não se perder ao atualizar a página.
  useEffect(() => saveCampaignDraft(draft), [draft]);

  // Se a campanha em edição foi excluída, o rascunho vira uma campanha nova.
  useEffect(() => {
    if (draft.editingId && !editing) setDraft((d) => ({ ...d, editingId: null }));
  }, [draft.editingId, editing]);

  // Se o produto escolhido foi excluído, volta para "empresa em geral".
  useEffect(() => {
    if (draft.productId && !product) setDraft((d) => ({ ...d, productId: '' }));
  }, [draft.productId, product]);

  const set = (patch: Partial<CampaignDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (submitted) setErrors(validateCampaign(next));
  };

  const resetDraft = () => {
    setDraft(emptyCampaignDraft());
    setErrors({});
    setSubmitted(false);
  };

  const save = () => {
    const found = validateCampaign(draft);
    setSubmitted(true);
    setErrors(found);
    if (hasErrors(found)) {
      toast.error('Complete os campos destacados para salvar a campanha.');
      focusFirstError();
      return;
    }
    const data = {
      name: draft.name.trim(),
      productId: draft.productId,
      platform: draft.platform,
      text: draft.text.trim(),
      cta: draft.cta.trim(),
      artStyle: draft.artStyle,
      artTitle: draft.artTitle.trim(),
    };
    if (editing) {
      updateCampaign(editing.id, data);
      toast.success(`Campanha "${data.name}" atualizada!`);
    } else {
      addCampaign(data);
      toast.success(`Campanha "${data.name}" salva!`);
    }
    resetDraft();
  };

  const startEdit = (c: Campaign) => {
    setDraft({
      editingId: c.id,
      name: c.name,
      productId: c.productId,
      platform: c.platform,
      text: c.text,
      cta: c.cta,
      artStyle: c.artStyle,
      artTitle: c.artTitle,
    });
    setErrors({});
    setSubmitted(false);
    editorRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  const applyAida = () => set({ text: buildAidaText({ company, product, cta: draft.cta, platform: draft.platform }) });

  const hasDraftContent = Boolean(draft.name || draft.text || draft.cta || draft.artTitle);

  return (
    <div>
      <StepHeader stepId="publicacoes" />

      <Card className="mb-6 animate-fade-up" data-field-error={stepErrors.campaigns ? 'true' : undefined}>
        <CardHeader
          icon={Layers}
          title={`Campanhas salvas${campaigns.length ? ` (${campaigns.length})` : ''}`}
          description="Clique em uma campanha para editar. Você pode criar quantas quiser."
        />
        {campaigns.length === 0 ? (
          <EmptyState
            compact
            icon={SquarePen}
            title="Nenhuma campanha salva ainda"
            description="Monte a sua primeira publicação no editor abaixo e clique em “Salvar campanha”."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {campaigns.map((c) => {
              const ch = getChannel(c.platform)!;
              const prod = products.find((p) => p.id === c.productId);
              const active = c.id === draft.editingId;
              return (
                <li
                  key={c.id}
                  className={cn(
                    'flex flex-col rounded-2xl border bg-white p-4 transition',
                    active ? 'border-violet-500 ring-1 ring-violet-500' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: ch.color }}>
                      <PlatformIcon channel={c.platform} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{c.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {ch.label} · {prod ? prod.name : 'Empresa em geral'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{c.text}</p>
                  <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2">
                    {active ? (
                      <span className="mr-auto text-xs font-semibold text-violet-600">Em edição</span>
                    ) : (
                      <Button variant="ghost" size="sm" className="mr-auto -ml-2" onClick={() => startEdit(c)} icon={<Pencil className="size-3.5" aria-hidden />}>
                        Editar
                      </Button>
                    )}
                    <IconButton
                      label={`Duplicar ${c.name}`}
                      onClick={() => {
                        duplicateCampaign(c.id);
                        toast.success('Campanha duplicada.');
                      }}
                    >
                      <Copy className="size-4" />
                    </IconButton>
                    <IconButton label={`Excluir ${c.name}`} tone="danger" onClick={() => setDeleting(c)}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <ErrorText>{stepErrors.campaigns}</ErrorText>
      </Card>

      <div ref={editorRef} className="grid scroll-mt-28 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <Card className="min-w-0 animate-fade-up">
          <CardHeader
            icon={SquarePen}
            title={editing ? `Editando: ${editing.name}` : 'Nova campanha'}
            description={editing ? 'Faça as alterações e salve.' : 'Monte a publicação e acompanhe a prévia ao lado.'}
            action={
              editing ? (
                <Button variant="ghost" size="sm" onClick={resetDraft} icon={<X className="size-4" aria-hidden />}>
                  Cancelar edição
                </Button>
              ) : undefined
            }
          />
          <form
            noValidate
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="grid gap-5 2xl:grid-cols-2">
              <TextField
                id="camp-name"
                label="Nome da campanha"
                required
                value={draft.name}
                maxLength={60}
                placeholder="Ex.: Lançamento de verão"
                error={errors.name}
                onChange={(e) => set({ name: e.target.value })}
              />
              <SelectField
                id="camp-product"
                label="Produto divulgado"
                value={draft.productId}
                options={[
                  { value: '', label: 'A empresa em geral' },
                  ...products.map((p) => ({ value: p.id, label: `${p.name} · ${formatCurrency(p.price)}` })),
                ]}
                hint={
                  products.length === 0 ? (
                    <>
                      Cadastre itens na{' '}
                      <Link to="/etapa/produtos" className="font-semibold text-violet-700 underline underline-offset-2">
                        Etapa 4
                      </Link>{' '}
                      para divulgar um produto específico.
                    </>
                  ) : undefined
                }
                onChange={(e) => set({ productId: e.target.value })}
              />
            </div>

            <FieldGroup legend="Plataforma escolhida" required>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {CHANNELS.map((ch) => (
                  <RadioCard
                    key={ch.id}
                    name="camp-platform"
                    value={ch.id}
                    checked={draft.platform === ch.id}
                    onChange={(value) => set({ platform: value as ChannelId })}
                    className="flex-col items-center gap-1.5 px-1 py-3 text-center"
                    hideCheck
                  >
                    <span
                      className="flex size-9 items-center justify-center rounded-xl text-white"
                      style={{ background: ch.color }}
                    >
                      <PlatformIcon channel={ch.id} className="size-[18px]" />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight text-slate-700">{ch.label}</span>
                  </RadioCard>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup legend="Modelo da arte">
              <div className="grid grid-cols-2 gap-2">
                {ART_STYLES.map((art) => (
                  <RadioCard
                    key={art.id}
                    name="camp-art"
                    value={art.id}
                    checked={draft.artStyle === art.id}
                    onChange={(value) => set({ artStyle: value as ArtStyleId })}
                    className="flex-col gap-0.5 p-3"
                  >
                    <span className="pr-5 text-sm font-semibold text-slate-800">{art.label}</span>
                    <span className="text-xs text-slate-500">{art.description}</span>
                  </RadioCard>
                ))}
              </div>
            </FieldGroup>

            <TextField
              id="camp-art-title"
              label="Título da arte"
              value={draft.artTitle}
              maxLength={60}
              placeholder={draft.artStyle === 'frase' ? brand.slogan || 'Uma frase marcante' : product?.name || company.name || 'Título curto e chamativo'}
              hint="Opcional. Se ficar em branco, usamos o nome do produto ou da empresa."
              onChange={(e) => set({ artTitle: e.target.value })}
            />

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500">Sem ideias? Monte um texto com as suas respostas:</span>
                <Button
                  variant="soft"
                  size="sm"
                  icon={<WandSparkles className="size-4" aria-hidden />}
                  onClick={() => (draft.text.trim() ? setConfirmAida(true) : applyAida())}
                >
                  Montar texto com AIDA
                </Button>
              </div>
              <TextAreaField
                id="camp-text"
                label="Texto da publicação"
                required
                rows={7}
                maxLength={2200}
                softLimit={channel.textLimit}
                value={draft.text}
                placeholder="Escreva a legenda ou a mensagem da sua publicação…"
                hint={channel.textTip}
                error={errors.text}
                onChange={(e) => set({ text: e.target.value })}
              />
            </div>

            <div>
              <TextField
                id="camp-cta"
                label="Chamada para ação"
                required
                value={draft.cta}
                maxLength={30}
                placeholder="Escolha abaixo ou escreva a sua"
                hint="É o convite para o cliente agir: comprar, chamar, agendar…"
                error={errors.cta}
                onChange={(e) => set({ cta: e.target.value })}
              />
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {CTA_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={draft.cta === option}
                    onClick={() => set({ cta: option })}
                    className={chipClass(draft.cta === option, 'px-3 py-1 text-xs')}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              {hasDraftContent && !editing && (
                <Button variant="ghost" onClick={resetDraft} icon={<Eraser className="size-4" aria-hidden />}>
                  Limpar
                </Button>
              )}
              <Button type="submit" icon={<Save className="size-4" aria-hidden />}>
                {editing ? 'Salvar alterações' : 'Salvar campanha'}
              </Button>
            </div>
          </form>
        </Card>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
            Prévia no {channel.label}
          </p>
          <div className="rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200/70 p-4 sm:p-6">
            <PostPreview
              post={draft}
              product={product}
              brand={brand}
              company={company}
              sponsored={(project.marketing.adBudget ?? 0) > 0}
            />
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">Simulação para fins educativos.</p>
        </aside>
      </div>

      <Callout tone="info" title="Fórmula AIDA" className="mt-6">
        Um bom anúncio chama <strong>Atenção</strong>, desperta <strong>Interesse</strong>, cria <strong>Desejo</strong> e
        termina com uma <strong>Ação</strong> clara. O botão “Montar texto com AIDA” usa as respostas das etapas anteriores
        como ponto de partida — depois, deixe o texto com a sua cara!
      </Callout>

      <ConfirmDialog
        open={confirmAida}
        tone="default"
        title="Substituir o texto atual?"
        confirmLabel="Substituir texto"
        message={<p>O texto que você já escreveu será trocado por um novo, montado com a fórmula AIDA.</p>}
        onCancel={() => setConfirmAida(false)}
        onConfirm={() => {
          applyAida();
          setConfirmAida(false);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir esta campanha?"
        confirmLabel="Excluir"
        message={
          <p>
            A campanha <strong className="text-slate-900">{deleting?.name}</strong> será excluída.
          </p>
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            removeCampaign(deleting.id);
            toast.info(`Campanha "${deleting.name}" excluída.`);
          }
          setDeleting(null);
        }}
      />

      <StepFooter stepId="publicacoes" onContinue={submit} missingCount={Object.keys(allErrors).length} showErrors={showErrors} />
    </div>
  );
}
