import { useState } from 'react';
import { Check, MessageSquareQuote, Palette, RefreshCw, Shapes, Sparkles, Type, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandPreview } from '../../components/brand/BrandPreview';
import { ColorPicker } from '../../components/brand/ColorPicker';
import { StepFooter, StepHeader, useStepForm } from '../../components/layout/StepLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Callout } from '../../components/ui/Feedback';
import { FieldGroup, TextField } from '../../components/ui/Field';
import { RadioCard } from '../../components/ui/RadioCard';
import { useProject } from '../../context/ProjectContext';
import { PALETTES } from '../../lib/colors';
import { cn } from '../../lib/cn';
import { BRAND_STYLES } from '../../lib/constants';
import { initials } from '../../lib/format';
import { LOGO_ICONS } from '../../lib/logoIcons';
import { generateSlogans } from '../../lib/slogans';
import type { BrandStyleId } from '../../types';

export function BrandStep() {
  const { project, updateBrand } = useProject();
  const { errors, allErrors, showErrors, submit } = useStepForm('marca');
  const b = project.brand;
  const c = project.company;
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generate = () =>
    setSuggestions(
      generateSlogans({
        companyName: c.name,
        segment: c.segment,
        style: b.style,
        interests: project.audience.interests,
      }),
    );

  return (
    <div>
      <StepHeader stepId="marca" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Card className="animate-fade-up">
            <CardHeader
              icon={Palette}
              title="Cores da marca"
              description="A cor principal aparece no logotipo e nos destaques. A secundária complementa e dá contraste."
            />
            <p className="mb-2.5 text-sm font-semibold text-slate-700">Combinações prontas</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {PALETTES.map((palette) => {
                const active = b.primaryColor === palette.primary && b.secondaryColor === palette.secondary;
                return (
                  <button
                    key={palette.name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateBrand({ primaryColor: palette.primary, secondaryColor: palette.secondary })}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-3 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20',
                      active ? 'border-violet-500 text-violet-700 ring-1 ring-violet-500' : 'border-slate-200 text-slate-600',
                    )}
                  >
                    <span className="flex -space-x-1.5" aria-hidden>
                      <span className="size-6 rounded-full ring-2 ring-white" style={{ background: palette.primary }} />
                      <span className="size-6 rounded-full ring-2 ring-white" style={{ background: palette.secondary }} />
                    </span>
                    {palette.name}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-6 border-t border-slate-100 pt-5 md:grid-cols-2">
              <ColorPicker
                id="brand-primary"
                label="Cor principal"
                required
                value={b.primaryColor}
                error={errors.primaryColor}
                onChange={(primaryColor) => updateBrand({ primaryColor })}
              />
              <ColorPicker
                id="brand-secondary"
                label="Cor secundária"
                required
                value={b.secondaryColor}
                error={errors.secondaryColor}
                onChange={(secondaryColor) => updateBrand({ secondaryColor })}
              />
            </div>
          </Card>

          <Card className="animate-fade-up">
            <CardHeader icon={Type} title="Estilo da marca" description="Qual personalidade a sua marca vai transmitir?" />
            <FieldGroup legend="Escolha um estilo" required error={errors.style}>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {BRAND_STYLES.map((style) => (
                  <RadioCard
                    key={style.id}
                    name="brand-style"
                    value={style.id}
                    checked={b.style === style.id}
                    onChange={(value) => updateBrand({ style: value as BrandStyleId })}
                    className="items-center gap-3.5 p-3.5"
                  >
                    <span
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-700',
                        style.fontClass,
                        style.nameClass,
                      )}
                      aria-hidden
                    >
                      Aa
                    </span>
                    <span className="min-w-0 pr-5">
                      <span className="block text-sm font-bold text-slate-800">{style.label}</span>
                      <span className="block text-xs leading-snug text-slate-500">{style.description}</span>
                    </span>
                  </RadioCard>
                ))}
              </div>
            </FieldGroup>
          </Card>

          <Card className="animate-fade-up">
            <CardHeader
              icon={Shapes}
              title="Símbolo do logotipo"
              description="Opcional: escolha um ícone que represente a sua empresa ou use as iniciais do nome."
            />
            <div
              role="radiogroup"
              aria-label="Símbolo do logotipo"
              className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-10"
            >
              <button
                type="button"
                role="radio"
                aria-checked={b.icon === ''}
                onClick={() => updateBrand({ icon: '' })}
                title="Usar iniciais"
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20',
                  b.icon === ''
                    ? 'border-violet-500 bg-violet-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300',
                )}
              >
                {initials(c.name) || 'Aa'}
                <span className="sr-only">Usar iniciais</span>
              </button>
              {LOGO_ICONS.map(({ key, label, icon: Icon }) => {
                const active = b.icon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={label}
                    title={label}
                    onClick={() => updateBrand({ icon: key })}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20',
                      active
                        ? 'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-600/20'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-600',
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="animate-fade-up">
            <CardHeader
              icon={MessageSquareQuote}
              title="Slogan"
              description="Uma frase curta que resume a promessa da marca e fica na memória."
            />
            <TextField
              id="brand-slogan"
              label="Slogan da empresa"
              required
              value={b.slogan}
              maxLength={80}
              showCount
              placeholder="Escreva o seu ou use o gerador de ideias abaixo"
              error={errors.slogan}
              onChange={(e) => updateBrand({ slogan: e.target.value })}
            />

            <div className="mt-5 rounded-2xl border border-violet-100 bg-gradient-to-br from-blue-50/60 to-violet-50/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <WandSparkles className="size-4 text-violet-600" aria-hidden />
                    Gerador de slogans
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Cria ideias usando o nome, o segmento e o estilo da sua marca.
                  </p>
                </div>
                <Button
                  variant={suggestions.length ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={generate}
                  icon={suggestions.length ? <RefreshCw className="size-4" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
                >
                  {suggestions.length ? 'Gerar outras ideias' : 'Gerar sugestões'}
                </Button>
              </div>
              {(!c.name.trim() || !c.segment) && (
                <p className="mt-3 text-xs text-slate-500">
                  Para ideias personalizadas, preencha o nome e o segmento na{' '}
                  <Link to="/etapa/empresa" className="font-semibold text-violet-700 underline underline-offset-2">
                    Etapa 1
                  </Link>
                  .
                </p>
              )}
              {suggestions.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2" aria-live="polite">
                  {suggestions.map((slogan) => {
                    const chosen = b.slogan === slogan;
                    return (
                      <li key={slogan}>
                        <button
                          type="button"
                          onClick={() => updateBrand({ slogan })}
                          className={cn(
                            'group flex w-full animate-fade-up items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition hover:border-violet-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20',
                            chosen ? 'border-violet-500 ring-1 ring-violet-500' : 'border-slate-200',
                          )}
                        >
                          <span className="font-medium text-slate-700">{slogan}</span>
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
                              chosen ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700 group-hover:bg-violet-100',
                            )}
                          >
                            {chosen ? (
                              <>
                                <Check className="size-3" aria-hidden /> Em uso
                              </>
                            ) : (
                              'Usar'
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>

          <Callout>
            Marcas fortes são <strong>consistentes</strong>: usam sempre as mesmas cores, o mesmo estilo e o mesmo tom
            de voz. Assim, o cliente reconhece a empresa mesmo antes de ler o nome.
          </Callout>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <p className="mb-3 text-sm font-bold text-slate-700">Prévia da identidade</p>
          <BrandPreview brand={b} company={c} />
        </aside>
      </div>
      <StepFooter stepId="marca" onContinue={submit} missingCount={Object.keys(allErrors).length} showErrors={showErrors} />
    </div>
  );
}
