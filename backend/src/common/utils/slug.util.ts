/**
 * Convierte un string en un slug URL-safe (lowercase, sin tildes, separado por guiones).
 * Ejemplo: "Caminata al Volcán Barú" → "caminata-al-volcan-baru"
 */
export function slugify(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Garantiza unicidad probando sufijos numéricos hasta encontrar uno libre.
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  existsFn: (slug: string) => Promise<boolean>,
): Promise<string> {
  if (!(await existsFn(baseSlug))) return baseSlug;
  let suffix = 2;
  while (suffix < 1000) {
    const candidate = `${baseSlug}-${suffix}`;
    if (!(await existsFn(candidate))) return candidate;
    suffix += 1;
  }
  return `${baseSlug}-${Date.now()}`;
}
