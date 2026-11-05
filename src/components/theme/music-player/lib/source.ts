import { SOURCE_LABEL_KEYS } from '../config';
import type { TFunction } from '../types';

export function getSourceLabel(source: string, t: TFunction): string {
  const key = SOURCE_LABEL_KEYS[source];
  return key ? t(key) : source;
}
