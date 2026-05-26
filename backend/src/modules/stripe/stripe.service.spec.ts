import { StripeService } from './stripe.service';

describe('StripeService.toCents', () => {
  let svc: StripeService;
  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    svc = new StripeService();
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
