// Aparência padrão (uniforme) de cada função de funcionário.

import { getRole } from '../game/data';
import type { Gender, RoleId } from '../game/types';
import type { Look } from './art/characters';

export const ROLE_LOOK: Record<RoleId, Partial<Look>> = {
  atendente: { shirt: '#14b8a6', style: 'casual', apron: '#f97316' },
  vendedor: { shirt: '#f97316', style: 'esportivo' },
  marketing: { shirt: '#ec4899', style: 'criativo' },
  desenvolvedor: { shirt: '#334155', style: 'esportivo', glasses: true },
  gerente: { shirt: '#1e3a8a', style: 'social', pants: '#1f2937' },
};

/** Nome da função no feminino ou no masculino. */
export function roleTitle(role: RoleId, gender: Gender | undefined): string {
  if (gender === 'feminino') {
    if (role === 'vendedor') return 'Vendedora';
    if (role === 'desenvolvedor') return 'Desenvolvedora de produto';
  }
  return getRole(role).label;
}

/** Ajusta uma aparência aleatória para o sexo pedido (cabelo e roupa coerentes). */
export function withGender(look: Look, gender: Gender): Look {
  if (look.gender === gender) return look;
  const fem = gender === 'feminino';
  const hairStyle = fem ? (['curto', 'moicano', 'careca'].includes(look.hairStyle) ? 'longo' : look.hairStyle) : look.hairStyle === 'longo' ? 'curto' : look.hairStyle;
  return { ...look, gender, hairStyle, beard: fem ? false : look.beard, skirt: fem ? look.skirt : false };
}
