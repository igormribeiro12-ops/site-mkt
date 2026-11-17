// Aparência padrão (uniforme) de cada função de funcionário.

import type { RoleId } from '../game/types';
import type { Look } from './art/characters';

export const ROLE_LOOK: Record<RoleId, Partial<Look>> = {
  atendente: { shirt: '#14b8a6', style: 'casual', apron: '#f97316' },
  vendedor: { shirt: '#f97316', style: 'esportivo' },
  marketing: { shirt: '#ec4899', style: 'criativo' },
  desenvolvedor: { shirt: '#334155', style: 'esportivo', glasses: true },
  gerente: { shirt: '#1e3a8a', style: 'social', pants: '#1f2937' },
};
