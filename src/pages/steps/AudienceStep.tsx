import { Globe2, HeartHandshake, UserRound, Wallet } from 'lucide-react';
import { PersonaCard } from '../../components/audience/PersonaCard';
import { StepFooter, StepHeader, useStepForm } from '../../components/layout/StepLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { ChipGroup, TagInput, chipClass } from '../../components/ui/Chips';
import { Callout } from '../../components/ui/Feedback';
import { ErrorText, FieldGroup, NumberField, RequiredMark, TextAreaField, TextField } from '../../components/ui/Field';
import { RadioCard } from '../../components/ui/RadioCard';
import { useProject } from '../../context/ProjectContext';
import { AGE_PRESETS, INTEREST_SUGGESTIONS, ONLINE_PLACES, PURCHASING_POWER } from '../../lib/constants';
import type { PurchasingPower } from '../../types';

export function AudienceStep() {
  const { project, updateAudience } = useProject();
  const { errors, allErrors, showErrors, submit } = useStepForm('publico');
  const a = project.audience;

  return (
    <div>
      <StepHeader stepId="publico" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card className="animate-fade-up">
            <CardHeader
              icon={UserRound}
              title="Quem é o seu cliente?"
              description="Imagine uma pessoa real que compraria da sua empresa."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id="persona-name"
                label="Dê um nome ao seu cliente ideal"
                value={a.personaName}
                maxLength={40}
                placeholder="Ex.: Ana, a estudante"
                hint="Opcional — ajuda a imaginar uma pessoa de verdade."
                onChange={(e) => updateAudience({ personaName: e.target.value })}
              />
              <TextField
                id="persona-occupation"
                label="Ocupação"
                value={a.occupation}
                maxLength={60}
                placeholder="Ex.: estudante do ensino médio"
                hint="Opcional."
                onChange={(e) => updateAudience({ occupation: e.target.value })}
              />
            </div>

            <div className="mt-6" data-field-error={errors.age ? 'true' : undefined}>
              <p className="mb-1.5 text-sm font-semibold text-slate-700">
                Idade do público
                <RequiredMark />
              </p>
              <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Faixas de idade prontas">
                {AGE_PRESETS.map((preset) => {
                  const active = a.ageMin === preset.min && a.ageMax === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => updateAudience({ ageMin: preset.min, ageMax: preset.max })}
                      className={chipClass(active)}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid max-w-sm grid-cols-2 gap-3">
                <NumberField
                  id="age-min"
                  label="De"
                  integer
                  suffix="anos"
                  value={a.ageMin}
                  placeholder="18"
                  onValueChange={(ageMin) => updateAudience({ ageMin })}
                />
                <NumberField
                  id="age-max"
                  label="Até"
                  integer
                  suffix="anos"
                  value={a.ageMax}
                  placeholder="24"
                  onValueChange={(ageMax) => updateAudience({ ageMax })}
                />
              </div>
              <ErrorText>{errors.age}</ErrorText>
            </div>

            <TextField
              id="audience-location"
              label="Localização"
              required
              wrapperClassName="mt-6"
              value={a.location}
              maxLength={80}
              placeholder="Ex.: Zona Sul de São Paulo, todo o Brasil, minha cidade…"
              error={errors.location}
              onChange={(e) => updateAudience({ location: e.target.value })}
            />
          </Card>

          <Card className="animate-fade-up">
            <CardHeader
              icon={HeartHandshake}
              title="Interesses, necessidades e problemas"
              description="Entender o que o cliente gosta e o que o incomoda é a base de todo o marketing."
            />
            <FieldGroup
              legend="Interesses"
              required
              hint="Digite e aperte Enter, ou clique nas sugestões."
              error={errors.interests}
            >
              <TagInput
                id="audience-interests"
                value={a.interests}
                onChange={(interests) => updateAudience({ interests })}
                suggestions={INTEREST_SUGGESTIONS}
                placeholder="Ex.: música, games, culinária…"
                hasError={!!errors.interests}
              />
            </FieldGroup>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <TextAreaField
                id="audience-needs"
                label="Necessidades"
                required
                value={a.needs}
                maxLength={300}
                rows={3}
                placeholder="Ex.: praticidade no dia a dia, produtos com bom preço, atendimento rápido."
                hint="O que essa pessoa precisa ou deseja?"
                error={errors.needs}
                onChange={(e) => updateAudience({ needs: e.target.value })}
              />
              <TextAreaField
                id="audience-pains"
                label="Problemas que enfrenta"
                required
                value={a.painPoints}
                maxLength={300}
                rows={3}
                placeholder="Ex.: pouco tempo livre, dificuldade de encontrar opções saudáveis perto de casa."
                hint="O que tira o sono dessa pessoa?"
                error={errors.painPoints}
                onChange={(e) => updateAudience({ painPoints: e.target.value })}
              />
            </div>
          </Card>

          <Card className="animate-fade-up">
            <CardHeader
              icon={Wallet}
              title="Poder de compra estimado"
              description="Quanto esse público pode e costuma gastar? Isso influencia o preço dos seus produtos."
            />
            <FieldGroup legend="Escolha uma opção" required error={errors.purchasingPower}>
              <div className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-4">
                {PURCHASING_POWER.map((option) => (
                  <RadioCard
                    key={option.id}
                    name="purchasing-power"
                    value={option.id}
                    checked={a.purchasingPower === option.id}
                    onChange={(value) => updateAudience({ purchasingPower: value as PurchasingPower })}
                    className="flex-col gap-2 p-3.5"
                  >
                    <span className="flex gap-1" aria-hidden>
                      {[1, 2, 3, 4].map((level) => (
                        <span
                          key={level}
                          className={level <= option.level ? 'h-1.5 w-5 rounded-full bg-violet-500' : 'h-1.5 w-5 rounded-full bg-slate-200'}
                        />
                      ))}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{option.label}</span>
                    <span className="text-xs leading-snug text-slate-500">{option.description}</span>
                  </RadioCard>
                ))}
              </div>
            </FieldGroup>
          </Card>

          <Card className="animate-fade-up">
            <CardHeader
              icon={Globe2}
              title="Onde esse público está na internet?"
              description="Marque as redes e sites que o seu cliente usa com frequência."
            />
            <FieldGroup legend="Canais que o público usa" required error={errors.onlinePlaces}>
              <ChipGroup
                options={ONLINE_PLACES}
                value={a.onlinePlaces}
                onChange={(onlinePlaces) => updateAudience({ onlinePlaces })}
              />
            </FieldGroup>
          </Card>

          <Callout>
            Quem tenta falar com <strong>todo mundo</strong> acaba não falando com ninguém. Quanto mais claro for o seu
            cliente ideal, mais fácil será escolher canais, criar mensagens e definir preços.
          </Callout>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <p className="mb-3 text-sm font-bold text-slate-700">Prévia</p>
          <PersonaCard audience={a} brand={project.brand} />
        </aside>
      </div>
      <StepFooter stepId="publico" onContinue={submit} missingCount={Object.keys(allErrors).length} showErrors={showErrors} />
    </div>
  );
}
