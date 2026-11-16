import { IdCard, Shapes, Target } from 'lucide-react';
import { PitchCard } from '../../components/company/PitchCard';
import { StepFooter, StepHeader, useStepForm } from '../../components/layout/StepLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Callout } from '../../components/ui/Feedback';
import { FieldGroup, TextAreaField, TextField } from '../../components/ui/Field';
import { RadioCard } from '../../components/ui/RadioCard';
import { useProject } from '../../context/ProjectContext';
import { SEGMENTS } from '../../lib/constants';
import type { SegmentId } from '../../types';

export function CompanyStep() {
  const { project, updateCompany } = useProject();
  const { errors, allErrors, showErrors, submit } = useStepForm('empresa');
  const c = project.company;

  return (
    <div>
      <StepHeader stepId="empresa" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="animate-fade-up">
            <CardHeader
              icon={IdCard}
              title="Informações básicas"
              description="Como a sua empresa vai se chamar e quem está por trás dela."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id="company-name"
                label="Nome da empresa"
                required
                value={c.name}
                maxLength={60}
                showCount
                placeholder="Ex.: Doce Encanto"
                hint="Curto, fácil de falar e de lembrar."
                error={errors.name}
                onChange={(e) => updateCompany({ name: e.target.value })}
              />
              <TextField
                id="company-founder"
                label="Nome do fundador ou fundadora"
                required
                value={c.founder}
                maxLength={80}
                placeholder="Seu nome"
                error={errors.founder}
                onChange={(e) => updateCompany({ founder: e.target.value })}
              />
            </div>
          </Card>

          <Card className="animate-fade-up">
            <CardHeader icon={Shapes} title="Segmento de atuação" description="Em qual área do mercado a sua empresa vai atuar?" />
            <FieldGroup legend="Escolha um segmento" required error={errors.segment}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-5">
                {SEGMENTS.map((segment) => {
                  const Icon = segment.icon;
                  const checked = c.segment === segment.id;
                  return (
                    <RadioCard
                      key={segment.id}
                      name="segment"
                      value={segment.id}
                      checked={checked}
                      onChange={(value) => updateCompany({ segment: value as SegmentId })}
                      className="flex-col gap-2 p-3.5"
                    >
                      <span
                        className={
                          checked
                            ? 'flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white'
                            : 'flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500'
                        }
                      >
                        <Icon className="size-[18px]" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold leading-tight text-slate-800">{segment.label}</span>
                      <span className="text-xs leading-snug text-slate-500">{segment.hint}</span>
                    </RadioCard>
                  );
                })}
              </div>
            </FieldGroup>
            {c.segment === 'outros' && (
              <TextField
                id="company-segment-other"
                label="Qual é o segmento?"
                required
                wrapperClassName="mt-5 animate-fade-up"
                value={c.segmentOther}
                maxLength={40}
                placeholder="Ex.: Pets, turismo, sustentabilidade…"
                error={errors.segmentOther}
                onChange={(e) => updateCompany({ segmentOther: e.target.value })}
              />
            )}
          </Card>

          <Card className="animate-fade-up">
            <CardHeader
              icon={Target}
              title="Sobre o negócio"
              description="Responda pensando no seu cliente: por que ele escolheria a sua empresa?"
            />
            <div className="space-y-5">
              <TextAreaField
                id="company-description"
                label="Descrição da empresa"
                required
                value={c.description}
                maxLength={400}
                rows={3}
                placeholder="Ex.: Uma confeitaria on-line que faz doces artesanais por encomenda para festas e presentes."
                hint="O que a empresa faz, para quem e como funciona."
                error={errors.description}
                onChange={(e) => updateCompany({ description: e.target.value })}
              />
              <TextAreaField
                id="company-problem"
                label="Qual problema a empresa resolve?"
                required
                value={c.problem}
                maxLength={300}
                rows={2}
                placeholder="Ex.: É difícil encontrar doces caseiros de qualidade, com entrega rápida, no bairro."
                hint="Toda empresa existe para resolver um problema ou realizar um desejo de alguém."
                error={errors.problem}
                onChange={(e) => updateCompany({ problem: e.target.value })}
              />
              <TextAreaField
                id="company-offering"
                label="Qual produto ou serviço oferece?"
                required
                value={c.offering}
                maxLength={300}
                rows={2}
                placeholder="Ex.: Brigadeiros gourmet, bolos de pote e kits de presente."
                error={errors.offering}
                onChange={(e) => updateCompany({ offering: e.target.value })}
              />
              <TextAreaField
                id="company-differential"
                label="Qual é o diferencial competitivo?"
                required
                value={c.differential}
                maxLength={300}
                rows={2}
                placeholder="Ex.: Receitas da família, ingredientes naturais e entrega em até 1 hora."
                hint="O que você faz melhor ou diferente dos concorrentes?"
                error={errors.differential}
                onChange={(e) => updateCompany({ differential: e.target.value })}
              />
            </div>
          </Card>

          <Callout>
            Boas empresas nascem de <strong>problemas reais</strong>. Pense em quem sofre com esse problema e em como
            a sua solução deixa a vida dessa pessoa mais fácil, mais barata ou mais divertida.
          </Callout>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <PitchCard company={c} />
        </aside>
      </div>
      <StepFooter
        stepId="empresa"
        onContinue={submit}
        missingCount={Object.keys(allErrors).length}
        showErrors={showErrors}
      />
    </div>
  );
}
