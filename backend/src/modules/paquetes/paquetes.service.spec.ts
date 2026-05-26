import { Test } from '@nestjs/testing';
import { PaquetesService } from './paquetes.service';
import { PrismaService } from '../../prisma/prisma.service';

// Helpers to build mock paquete objects as the service now fetches via includes
function mockPaquete(overrides: any) {
  return {
    id: 'p1',
    noches: 3,
    diasDuracion: 3,
    descuentoPorcentaje: 0,
    habitacion: { tarifas: [] },
    actividad: null,
    vehiculo: null,
    ...overrides,
  };
}

describe('PaquetesService.calcularPrecio', () => {
  let service: PaquetesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      paquete: {
        findUnique: jest.fn(),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        PaquetesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(PaquetesService);
  });

  it('calcula precio con hospedaje + actividad + vehiculo, sin descuento, margen 12%', async () => {
    // habitacion.tarifas[0].precioNoche = 100, noches = 3 => 300
    // actividad.tarifas[0].precioAdulto = 50          =>  50
    // vehiculo.tarifas[0].precioDia = 40, dias = 3    => 120
    // base = 470, descuento 0%, margen 12% => 470 * 1.12 = 526.4
    prisma.paquete.findUnique.mockResolvedValue(
      mockPaquete({
        id: 'p1',
        noches: 3,
        diasDuracion: 3,
        descuentoPorcentaje: 0,
        habitacion: { tarifas: [{ precioNoche: 100 }] },
        actividad: { tarifas: [{ precioAdulto: 50 }] },
        vehiculo: { tarifas: [{ precioDia: 40 }] },
      }),
    );
    const precio = await service.calcularPrecio('p1');
    expect(precio).toBeCloseTo(526.4, 2);
  });

  it('aplica descuento antes del margen', async () => {
    // habitacion.tarifas[0].precioNoche = 100, noches = 2 => 200
    // no actividad, no vehiculo => base = 200
    // descuento 20% => 200 * 0.8 = 160, margen 12% => 160 * 1.12 = 179.2
    prisma.paquete.findUnique.mockResolvedValue(
      mockPaquete({
        id: 'p2',
        noches: 2,
        diasDuracion: 2,
        descuentoPorcentaje: 20,
        habitacion: { tarifas: [{ precioNoche: 100 }] },
        actividad: null,
        vehiculo: null,
      }),
    );
    const precio = await service.calcularPrecio('p2');
    expect(precio).toBeCloseTo(179.2, 2);
  });

  it('soporta paquete solo hospedaje', async () => {
    // habitacion.tarifas[0].precioNoche = 80, noches = 4 => 320
    // descuento 0%, margen 12% => 320 * 1.12 = 358.4
    prisma.paquete.findUnique.mockResolvedValue(
      mockPaquete({
        id: 'p3',
        noches: 4,
        diasDuracion: 4,
        descuentoPorcentaje: 0,
        habitacion: { tarifas: [{ precioNoche: 80 }] },
        actividad: null,
        vehiculo: null,
      }),
    );
    const precio = await service.calcularPrecio('p3');
    expect(precio).toBeCloseTo(358.4, 2);
  });

  it('devuelve 0 cuando no hay tarifas configuradas', async () => {
    prisma.paquete.findUnique.mockResolvedValue(
      mockPaquete({
        id: 'p4',
        noches: 2,
        diasDuracion: 2,
        descuentoPorcentaje: 0,
        habitacion: { tarifas: [] },
        actividad: null,
        vehiculo: null,
      }),
    );
    const precio = await service.calcularPrecio('p4');
    expect(precio).toBe(0);
  });
});
