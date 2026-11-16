import { useState } from 'react';
import { CalendarDays, Check, CircleDollarSign, Megaphone, Newspaper, Share2 } from 'lucide-react';
import { PlatformIcon } from '../../components/brand/PlatformIcon';
import { StepFooter, StepHeader, useStepForm } from '../../components/layout/StepLayout';
import { CalendarEntryModal } from '../../components/marketing/CalendarEntryModal';
import { EditorialCalendar } from '../../components/marketing/EditorialCalendar';
import { Card, CardHeader } from '../../components/ui/Card';
import { ChipGroup, SingleChipGroup } from '../../components/ui/Chips';
import { Callout } from '../../components/ui/Feedback';
import { ErrorText, FieldGroup, NumberField, TextAreaField } from '../../components/ui/Field';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { CHANNELS, CONTENT_PILLARS, FREQUENCIES, GOAL_TYPES, TACTICS, getChannel } from '../../lib/constants';
import { cn } from '../../lib/cn';
import { toISODate } from '../../lib/format';
import type { CalendarEntry, ChannelId } from '../../types';

/** Relaciona os lugares marcados na etapa de público com os canais disponíveis. */
const PLACE_TO_CHANNEL: Record<string, ChannelId> = {
  Instagram: 'instagram',
  TikTok: 'tiktok',
  Facebook: 'facebook',
  'Google (pesquisas)': 'google',
  WhatsApp: 'whatsapp',
  'Blogs e sites': 'site',
};

export function MarketingStep() {
  const { project, updateMarketing, addCalendarEntry, updateCalendarEntry, removeCalendarEntry } = useProject();
  const toast = useToast();
  const { errors, allErrors, showErrors, submit } = useStepForm('marketing');
  const m = project.marketing;
  const [calendarModal, setCalendarModal] = useState<{ open: boolean; entry: CalendarEntry | null; date: string }>({
    open: false,
    entry: null,
    date: toISODate(new Date()),
  });

  const audienceChannels = project.audience.onlinePlaces
    .map((place) => PLACE_TO_CHANNEL[place])
    .filter((c): c is ChannelId => Boolean(c));

  const toggleChannel = (id: ChannelId) => {
    const channels = m.channels.includes(id) ? m.channels.filter((c) => c !== id) : [...m.channels, id];
    const mainChannel = channels.includes(m.mainChannel as ChannelId) ? m.mainChannel : (channels[0] ?? '');
    updateMarketing({ channels, mainChannel });
  };

  return (
    <div>
      <StepHeader stepId="marketing" />
      <div className="space-y-6">
        <Card className="animate-fade-up">
          <CardHeader
            icon={Share2}
            title="Redes sociais e canais"
            description="Onde a sua empresa vai aparecer? Comece por poucos canais e faça bem feito."
          />
          <FieldGroup
            legend="Quais canais você vai utilizar?"
            required
            error={errors.channels}
            hint={
              audienceChannels.length > 0 ? (
                <>
                  Na etapa de público, você marcou que o seu cliente está em:{' '}
                  <strong className="text-slate-700">
                    {audienceChannels.map((c) => getChannel(c)?.label).join(', ')}
                  </strong>
                  .
                </>
              ) : undefined
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {CHANNELS.map((channel) => {
                const active = m.channels.includes(channel.id);
                const recommended = audienceChannels.includes(channel.id);
                return (
                  <button
                    key={channel.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleChannel(channel.id)}
                    className={cn(
                      'relative flex items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/25',
                      active
                        ? 'border-violet-500 bg-violet-50/60 ring-1 ring-violet-500'
                        : 'border-slate-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md hover:shadow-slate-900/5',
                    )}
                  >
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{
                        background:
                          channel.id === 'instagram'
                            ? 'linear-gradient(45deg, #f9ce34, #ee2a7b 50%, #6228d7)'
                            : channel.color,
                      }}
                    >
                      <PlatformIcon channel={channel.id} className="size-5" />
                    </span>
                    <span className="min-w-0 pr-5">
                      <span className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-slate-800">
                        {channel.label}
                        {recommended && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            Seu público está aqui
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500">{channel.bestFor}</span>
                    </span>
                    {active && (
                      <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-violet-600 text-white">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </FieldGroup>
          {m.channels.length > 1 && (
            <div className="mt-5 animate-fade-up border-t border-slate-100 pt-5">
              <p className="mb-2 text-sm font-semibold text-slate-700">Qual será o canal principal?</p>
              <SingleChipGroup
                label="Canal principal"
                options={m.channels.map((c) => getChannel(c)!.label)}
                value={getChannel(m.mainChannel)?.label ?? ''}
                onChange={(label) => {
                  const found = CHANNELS.find((c) => c.label === label);
                  if (found) updateMarketing({ mainChannel: found.id });
                }}
              />
            </div>
          )}
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            icon={Megaphone}
            title="Divulgação"
            description="Quais ações você vai usar para que as pessoas conheçam a sua empresa?"
          />
          <FieldGroup legend="Ações de divulgação" hint="Opcional: marque as que pretende usar.">
            <ChipGroup options={TACTICS} value={m.tactics} onChange={(tactics) => updateMarketing({ tactics })} />
          </FieldGroup>
          <TextAreaField
            id="mkt-promotion"
            label="Como você vai divulgar a empresa?"
            required
            wrapperClassName="mt-5"
            rows={3}
            maxLength={400}
            value={m.promotion}
            placeholder="Ex.: Vou postar vídeos mostrando a produção, fazer parceria com uma página do bairro e oferecer cupom de 10% na primeira compra."
            error={errors.promotion}
            onChange={(e) => updateMarketing({ promotion: e.target.value })}
          />
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            icon={Newspaper}
            title="Estratégia de conteúdo"
            description="O que você vai publicar e com que frequência?"
          />
          <FieldGroup legend="Tipos de conteúdo" hint="Opcional: misture conteúdos que ensinam, divertem e vendem.">
            <ChipGroup
              options={CONTENT_PILLARS}
              value={m.contentPillars}
              onChange={(contentPillars) => updateMarketing({ contentPillars })}
            />
          </FieldGroup>
          <TextAreaField
            id="mkt-content"
            label="Qual será a sua estratégia de conteúdo?"
            required
            wrapperClassName="mt-5"
            rows={3}
            maxLength={400}
            value={m.contentStrategy}
            placeholder="Ex.: Segunda: dica rápida. Quarta: bastidores. Sexta: depoimento de cliente e promoção do fim de semana."
            error={errors.contentStrategy}
            onChange={(e) => updateMarketing({ contentStrategy: e.target.value })}
          />
          <FieldGroup legend="Frequência de publicação" required error={errors.frequency} className="mt-5">
            <SingleChipGroup
              label="Frequência de publicação"
              options={FREQUENCIES}
              value={m.frequency}
              onChange={(frequency) => updateMarketing({ frequency })}
            />
          </FieldGroup>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            icon={CircleDollarSign}
            title="Investimento e objetivo"
            description="Quanto investir em anúncios e qual resultado você espera alcançar."
          />
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <NumberField
              id="mkt-budget"
              label="Investimento em anúncios"
              required
              prefix="R$"
              suffix="/mês"
              placeholder="0,00"
              value={m.adBudget}
              hint="Coloque 0 se for usar apenas divulgação gratuita."
              error={errors.adBudget}
              onValueChange={(adBudget) => updateMarketing({ adBudget })}
            />
            <FieldGroup legend="Principal objetivo" hint="Opcional: escolha o foco da sua estratégia.">
              <SingleChipGroup
                label="Principal objetivo"
                options={GOAL_TYPES}
                value={m.goalType}
                onChange={(goalType) => updateMarketing({ goalType })}
              />
            </FieldGroup>
          </div>
          <TextAreaField
            id="mkt-goal"
            label="Qual resultado deseja alcançar?"
            required
            wrapperClassName="mt-5"
            rows={2}
            maxLength={300}
            value={m.goal}
            placeholder="Ex.: Conquistar 300 seguidores e fazer 40 vendas no primeiro mês."
            hint="Bons objetivos têm número e prazo: dá para saber se você chegou lá."
            error={errors.goal}
            onChange={(e) => updateMarketing({ goal: e.target.value })}
          />
        </Card>

        <Card className="animate-fade-up" data-field-error={errors.calendar ? 'true' : undefined}>
          <CardHeader
            icon={CalendarDays}
            title="Calendário editorial"
            description="Planeje as publicações do mês. Clique em um dia para adicionar."
          />
          <EditorialCalendar
            entries={m.calendar}
            onAdd={(date) => setCalendarModal({ open: true, entry: null, date })}
            onEdit={(entry) => setCalendarModal({ open: true, entry, date: entry.date })}
          />
          <ErrorText>{errors.calendar}</ErrorText>
        </Card>

        <Callout>
          Constância vale mais que quantidade. É melhor publicar <strong>3 vezes por semana, todas as semanas</strong>,
          do que 10 vezes em uma semana e sumir no mês seguinte.
        </Callout>
      </div>

      <CalendarEntryModal
        open={calendarModal.open}
        entry={calendarModal.entry}
        defaultDate={calendarModal.date}
        channels={m.channels}
        onClose={() => setCalendarModal((s) => ({ ...s, open: false }))}
        onSave={(data) => {
          if (calendarModal.entry) {
            updateCalendarEntry(calendarModal.entry.id, data);
            toast.success('Publicação atualizada no calendário.');
          } else {
            addCalendarEntry(data);
            toast.success('Publicação adicionada ao calendário.');
          }
          setCalendarModal((s) => ({ ...s, open: false }));
        }}
        onDelete={(id) => {
          removeCalendarEntry(id);
          toast.info('Publicação removida do calendário.');
          setCalendarModal((s) => ({ ...s, open: false }));
        }}
      />

      <StepFooter stepId="marketing" onContinue={submit} missingCount={Object.keys(allErrors).length} showErrors={showErrors} />
    </div>
  );
}
