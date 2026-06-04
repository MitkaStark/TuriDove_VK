import { StripeService } from './stripe.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StripeService.toCents', () => {
  let svc: StripeService;
  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    // Mock mínimo de PrismaService — toCents() no toca BD
    const prismaMock = {} as PrismaService;
    svc = new StripeService(prismaMock);
  });

  it('1 USD = 100 cents', () => {
    expect(svc.toCents(1)).toBe(100);
  });

  it('redondea decimales correctamente', () => {
    expect(svc.toCents(1.005)).toBe(101);
    expect(svc.toCents(1.004)).toBe(100);
  });

  it('maneja amounts grandes', () => {
    expect(svc.toCents(12345.67)).toBe(1234567);
  });
});
