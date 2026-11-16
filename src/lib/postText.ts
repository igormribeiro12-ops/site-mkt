// Monta um texto de publicação a partir dos dados que o próprio aluno
// preencheu, seguindo a estrutura AIDA (Atenção, Interesse, Desejo, Ação).

import type { ChannelId, CompanyInfo, Product } from '../types';
import { segmentLabel } from './constants';
import { formatCurrency, toHandle } from './format';

interface AidaInput {
  company: CompanyInfo;
  product?: Product;
  cta: string;
  platform: ChannelId;
}

function firstSentence(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  const match = clean.match(/^(.+?[.!?])(\s|$)/);
  return (match ? match[1] : clean).replace(/[.!?]+$/, '');
}

function splitList(text: string): string[] {
  return text
    .split(/\n|;|,|•/)
    .map((s) => s.trim().replace(/^[-–•✓✅]\s*/, ''))
    .filter((s) => s.length > 1);
}

function hashtags(company: CompanyInfo): string {
  const tags = [`#${toHandle(company.name)}`];
  const seg = segmentLabel(company.segment, company.segmentOther);
  if (seg) tags.push(`#${toHandle(seg)}`);
  tags.push('#empreendedorismo');
  return tags.join(' ');
}

export function buildAidaText({ company, product, cta, platform }: AidaInput): string {
  const subject = product?.name || company.name || 'nossa empresa';
  const interest = firstSentence(product?.description || company.description || company.offering);
  const benefits = splitList(product?.benefits || company.differential).slice(0, 3);
  const action = cta.trim() || 'Fale com a gente';
  const price = product && product.price > 0 ? formatCurrency(product.price) : '';

  if (platform === 'google') {
    const benefit = benefits[0] ?? interest;
    return `${subject}: ${benefit}. ${action}!`.replace(/\s+/g, ' ').slice(0, 90);
  }

  const lines: string[] = [];
  if (platform === 'whatsapp') lines.push(`Olá! 👋 Já conhece ${subject}?`);
  else lines.push(`✨ Já conhece ${subject}?`);
  if (interest) lines.push('', `${interest}.`);
  if (benefits.length > 0) {
    lines.push('');
    benefits.forEach((b) => lines.push(`✅ ${b.charAt(0).toUpperCase()}${b.slice(1)}`));
  }
  if (price) lines.push('', `💰 Por ${price}`);
  lines.push('', `👉 ${action}!`);
  if (platform === 'instagram' || platform === 'tiktok') lines.push('', hashtags(company));
  return lines.join('\n');
}
