// Mapa do Brasil: regiões, os 27 estados (com a posição no mapa em quadrados)
// e as cidades onde a empresa pode ter sede ou abrir filiais.
// Populações aproximadas (milhões de habitantes, Censo 2022), usadas só para
// dar o tamanho de cada mercado no jogo.

export type RegionId = 'norte' | 'nordeste' | 'centro-oeste' | 'sudeste' | 'sul';

export interface Region {
  id: RegionId;
  label: string;
  color: string;
}

export const REGIONS: Region[] = [
  { id: 'norte', label: 'Norte', color: '#22c55e' },
  { id: 'nordeste', label: 'Nordeste', color: '#f59e0b' },
  { id: 'centro-oeste', label: 'Centro-Oeste', color: '#ef4444' },
  { id: 'sudeste', label: 'Sudeste', color: '#3b82f6' },
  { id: 'sul', label: 'Sul', color: '#a855f7' },
];

export interface StateDef {
  uf: string;
  name: string;
  region: RegionId;
  /** Posição no mapa em quadrados (coluna e linha). */
  col: number;
  row: number;
}

export const STATES: StateDef[] = [
  { uf: 'RR', name: 'Roraima', region: 'norte', col: 1, row: 0 },
  { uf: 'AP', name: 'Amapá', region: 'norte', col: 3, row: 0 },
  { uf: 'AM', name: 'Amazonas', region: 'norte', col: 1, row: 1 },
  { uf: 'PA', name: 'Pará', region: 'norte', col: 2, row: 1 },
  { uf: 'MA', name: 'Maranhão', region: 'nordeste', col: 3, row: 1 },
  { uf: 'CE', name: 'Ceará', region: 'nordeste', col: 4, row: 1 },
  { uf: 'RN', name: 'Rio Grande do Norte', region: 'nordeste', col: 5, row: 1 },
  { uf: 'AC', name: 'Acre', region: 'norte', col: 0, row: 2 },
  { uf: 'RO', name: 'Rondônia', region: 'norte', col: 1, row: 2 },
  { uf: 'TO', name: 'Tocantins', region: 'norte', col: 2, row: 2 },
  { uf: 'PI', name: 'Piauí', region: 'nordeste', col: 3, row: 2 },
  { uf: 'PE', name: 'Pernambuco', region: 'nordeste', col: 4, row: 2 },
  { uf: 'PB', name: 'Paraíba', region: 'nordeste', col: 5, row: 2 },
  { uf: 'MT', name: 'Mato Grosso', region: 'centro-oeste', col: 1, row: 3 },
  { uf: 'GO', name: 'Goiás', region: 'centro-oeste', col: 2, row: 3 },
  { uf: 'BA', name: 'Bahia', region: 'nordeste', col: 3, row: 3 },
  { uf: 'AL', name: 'Alagoas', region: 'nordeste', col: 4, row: 3 },
  { uf: 'SE', name: 'Sergipe', region: 'nordeste', col: 5, row: 3 },
  { uf: 'MS', name: 'Mato Grosso do Sul', region: 'centro-oeste', col: 1, row: 4 },
  { uf: 'DF', name: 'Distrito Federal', region: 'centro-oeste', col: 2, row: 4 },
  { uf: 'MG', name: 'Minas Gerais', region: 'sudeste', col: 3, row: 4 },
  { uf: 'ES', name: 'Espírito Santo', region: 'sudeste', col: 4, row: 4 },
  { uf: 'PR', name: 'Paraná', region: 'sul', col: 1, row: 5 },
  { uf: 'SP', name: 'São Paulo', region: 'sudeste', col: 2, row: 5 },
  { uf: 'RJ', name: 'Rio de Janeiro', region: 'sudeste', col: 3, row: 5 },
  { uf: 'SC', name: 'Santa Catarina', region: 'sul', col: 1, row: 6 },
  { uf: 'RS', name: 'Rio Grande do Sul', region: 'sul', col: 1, row: 7 },
];

export interface CityDef {
  id: string;
  name: string;
  uf: string;
  /** População aproximada em milhões. */
  pop: number;
  capital?: boolean;
}

export const CITIES: CityDef[] = [
  { id: 'sao-paulo', name: 'São Paulo', uf: 'SP', pop: 11.45, capital: true },
  { id: 'campinas', name: 'Campinas', uf: 'SP', pop: 1.14 },
  { id: 'ribeirao-preto', name: 'Ribeirão Preto', uf: 'SP', pop: 0.7 },
  { id: 'santos', name: 'Santos', uf: 'SP', pop: 0.42 },
  { id: 'rio-de-janeiro', name: 'Rio de Janeiro', uf: 'RJ', pop: 6.21, capital: true },
  { id: 'niteroi', name: 'Niterói', uf: 'RJ', pop: 0.48 },
  { id: 'belo-horizonte', name: 'Belo Horizonte', uf: 'MG', pop: 2.32, capital: true },
  { id: 'uberlandia', name: 'Uberlândia', uf: 'MG', pop: 0.71 },
  { id: 'juiz-de-fora', name: 'Juiz de Fora', uf: 'MG', pop: 0.54 },
  { id: 'vitoria', name: 'Vitória', uf: 'ES', pop: 0.32, capital: true },
  { id: 'vila-velha', name: 'Vila Velha', uf: 'ES', pop: 0.47 },
  { id: 'curitiba', name: 'Curitiba', uf: 'PR', pop: 1.77, capital: true },
  { id: 'londrina', name: 'Londrina', uf: 'PR', pop: 0.56 },
  { id: 'maringa', name: 'Maringá', uf: 'PR', pop: 0.41 },
  { id: 'florianopolis', name: 'Florianópolis', uf: 'SC', pop: 0.54, capital: true },
  { id: 'joinville', name: 'Joinville', uf: 'SC', pop: 0.62 },
  { id: 'blumenau', name: 'Blumenau', uf: 'SC', pop: 0.36 },
  { id: 'porto-alegre', name: 'Porto Alegre', uf: 'RS', pop: 1.33, capital: true },
  { id: 'caxias-do-sul', name: 'Caxias do Sul', uf: 'RS', pop: 0.46 },
  { id: 'pelotas', name: 'Pelotas', uf: 'RS', pop: 0.33 },
  { id: 'salvador', name: 'Salvador', uf: 'BA', pop: 2.42, capital: true },
  { id: 'feira-de-santana', name: 'Feira de Santana', uf: 'BA', pop: 0.62 },
  { id: 'vitoria-da-conquista', name: 'Vitória da Conquista', uf: 'BA', pop: 0.37 },
  { id: 'recife', name: 'Recife', uf: 'PE', pop: 1.49, capital: true },
  { id: 'caruaru', name: 'Caruaru', uf: 'PE', pop: 0.38 },
  { id: 'petrolina', name: 'Petrolina', uf: 'PE', pop: 0.39 },
  { id: 'fortaleza', name: 'Fortaleza', uf: 'CE', pop: 2.43, capital: true },
  { id: 'juazeiro-do-norte', name: 'Juazeiro do Norte', uf: 'CE', pop: 0.29 },
  { id: 'sao-luis', name: 'São Luís', uf: 'MA', pop: 1.04, capital: true },
  { id: 'imperatriz', name: 'Imperatriz', uf: 'MA', pop: 0.27 },
  { id: 'teresina', name: 'Teresina', uf: 'PI', pop: 0.87, capital: true },
  { id: 'natal', name: 'Natal', uf: 'RN', pop: 0.75, capital: true },
  { id: 'mossoro', name: 'Mossoró', uf: 'RN', pop: 0.26 },
  { id: 'joao-pessoa', name: 'João Pessoa', uf: 'PB', pop: 0.83, capital: true },
  { id: 'campina-grande', name: 'Campina Grande', uf: 'PB', pop: 0.42 },
  { id: 'maceio', name: 'Maceió', uf: 'AL', pop: 0.96, capital: true },
  { id: 'aracaju', name: 'Aracaju', uf: 'SE', pop: 0.6, capital: true },
  { id: 'goiania', name: 'Goiânia', uf: 'GO', pop: 1.44, capital: true },
  { id: 'anapolis', name: 'Anápolis', uf: 'GO', pop: 0.4 },
  { id: 'brasilia', name: 'Brasília', uf: 'DF', pop: 2.82, capital: true },
  { id: 'cuiaba', name: 'Cuiabá', uf: 'MT', pop: 0.65, capital: true },
  { id: 'rondonopolis', name: 'Rondonópolis', uf: 'MT', pop: 0.24 },
  { id: 'campo-grande', name: 'Campo Grande', uf: 'MS', pop: 0.9, capital: true },
  { id: 'dourados', name: 'Dourados', uf: 'MS', pop: 0.24 },
  { id: 'manaus', name: 'Manaus', uf: 'AM', pop: 2.06, capital: true },
  { id: 'belem', name: 'Belém', uf: 'PA', pop: 1.3, capital: true },
  { id: 'santarem', name: 'Santarém', uf: 'PA', pop: 0.33 },
  { id: 'rio-branco', name: 'Rio Branco', uf: 'AC', pop: 0.36, capital: true },
  { id: 'porto-velho', name: 'Porto Velho', uf: 'RO', pop: 0.46, capital: true },
  { id: 'boa-vista', name: 'Boa Vista', uf: 'RR', pop: 0.41, capital: true },
  { id: 'macapa', name: 'Macapá', uf: 'AP', pop: 0.44, capital: true },
  { id: 'palmas', name: 'Palmas', uf: 'TO', pop: 0.3, capital: true },
];

export const DEFAULT_HOME_CITY = 'sao-paulo';

export function getCity(id: string): CityDef | undefined {
  return CITIES.find((c) => c.id === id);
}

export function getState(uf: string): StateDef | undefined {
  return STATES.find((s) => s.uf === uf);
}

export function getRegion(id: RegionId): Region {
  return REGIONS.find((r) => r.id === id)!;
}

export function citiesOf(uf: string): CityDef[] {
  return CITIES.filter((c) => c.uf === uf);
}

export function statesOf(region: RegionId): StateDef[] {
  return STATES.filter((s) => s.region === region);
}

export function regionOfCity(city: CityDef): RegionId {
  return getState(city.uf)!.region;
}

export function cityLabel(id: string): string {
  const c = getCity(id);
  return c ? `${c.name} (${c.uf})` : id;
}

/** Tamanho do mercado da cidade em relação ao mercado de um bairro (cresce com a raiz da população). */
export function marketFactor(city: CityDef): number {
  return Math.round((0.5 + 0.6 * Math.sqrt(city.pop)) * 10) / 10;
}
