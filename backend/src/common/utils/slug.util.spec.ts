import { slugify, ensureUniqueSlug } from './slug.util';

describe('slugify', () => {
  it('convierte espacios a guiones', () => {
    expect(slugify('Tour por cafetales')).toBe('tour-por-cafetales');
  });

  it('elimina tildes y caracteres no ASCII', () => {
    expect(slugify('Caminata al Volcán Barú')).toBe('caminata-al-volcan-baru');
  });

  it('colapsa múltiples separadores', () => {
    expect(slugify('Tour --- por  el  café')).toBe('tour-por-el-cafe');
  });

  it('recorta guiones al inicio y al final', () => {
    expect(slugify('-Hola Mundo-')).toBe('hola-mundo');
  });

  it('maneja strings vacíos como string vacío', () => {
    expect(slugify('')).toBe('');
  });

  it('preserva números', () => {
    expect(slugify('Tour 24h')).toBe('tour-24h');
  });
});

describe('ensureUniqueSlug', () => {
  it('devuelve el slug original si no existe', async () => {
    const existsFn = jest.fn().mockResolvedValue(false);
    const result = await ensureUniqueSlug('tour-cafe', existsFn);
    expect(result).toBe('tour-cafe');
    expect(existsFn).toHaveBeenCalledWith('tour-cafe');
  });

  it('agrega sufijo -2 si el slug existe', async () => {
    const existsFn = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const result = await ensureUniqueSlug('tour-cafe', existsFn);
    expect(result).toBe('tour-cafe-2');
  });

  it('incrementa el sufijo hasta encontrar uno libre', async () => {
    const existsFn = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const result = await ensureUniqueSlug('tour', existsFn);
    expect(result).toBe('tour-4');
  });
});
