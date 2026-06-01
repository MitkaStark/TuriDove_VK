import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (pwd: string) => bcrypt.hash(pwd, 10);

async function main() {
  console.log('Seeding TuriDove...');

  // Date helpers
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 11, 31);
  const validUntil = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  // --- Users ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@turidove.com' },
    update: {},
    create: {
      email: 'admin@turidove.com',
      password: await hash('Admin123!'),
      nombre: 'Admin',
      apellido: 'TuriDove',
      role: 'ADMIN',
      activo: true,
    },
  });

  const parisProv = await prisma.user.upsert({
    where: { email: 'paris.provider@turidove.com' },
    update: {},
    create: {
      email: 'paris.provider@turidove.com',
      password: await hash('Provider123!'),
      nombre: 'Paris',
      apellido: 'Provider',
      role: 'PROVEEDOR',
      activo: true,
    },
  });

  const asiaProv = await prisma.user.upsert({
    where: { email: 'asia.provider@turidove.com' },
    update: {},
    create: {
      email: 'asia.provider@turidove.com',
      password: await hash('Provider123!'),
      nombre: 'Asia',
      apellido: 'Provider',
      role: 'PROVEEDOR',
      activo: true,
    },
  });

  const boutiqueAg = await prisma.user.upsert({
    where: { email: 'boutique.agency@turidove.com' },
    update: {},
    create: {
      email: 'boutique.agency@turidove.com',
      password: await hash('Agency123!'),
      nombre: 'Boutique',
      apellido: 'Agency',
      role: 'AGENCIA',
      activo: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'operator@turidove.com' },
    update: {},
    create: {
      email: 'operator@turidove.com',
      password: await hash('Operator123!'),
      nombre: 'Operator',
      apellido: 'TuriDove',
      role: 'OPERADOR',
      activo: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'cliente1@example.com' },
    update: {},
    create: {
      email: 'cliente1@example.com',
      password: await hash('Client123!'),
      nombre: 'Cliente',
      apellido: 'Uno',
      role: 'CLIENTE',
      activo: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'cliente2@example.com' },
    update: {},
    create: {
      email: 'cliente2@example.com',
      password: await hash('Client123!'),
      nombre: 'Cliente',
      apellido: 'Dos',
      role: 'CLIENTE',
      activo: true,
    },
  });

  console.log('Users OK');

  // --- Hospedajes (6 destinos) ---
  // Schema notes: Hospedaje has no slug/ciudad. Uses provincia/distrito/corregimiento.
  // We use provincia as the visible city, distrito as country.
  const destinos = [
    { nombre: 'Le Marais Boutique', provincia: 'Paris', distrito: 'Francia', imagen: '/uploads/paris-hotel-1.jpg', proveedorId: parisProv.id },
    { nombre: 'Trastevere Suites', provincia: 'Roma', distrito: 'Italia', imagen: '/uploads/roma-hotel-1.jpg', proveedorId: parisProv.id },
    { nombre: 'Shibuya Modern', provincia: 'Tokio', distrito: 'Japon', imagen: '/uploads/tokio-hotel-1.jpg', proveedorId: asiaProv.id },
    { nombre: 'Midtown Premier', provincia: 'Nueva York', distrito: 'EE.UU.', imagen: '/uploads/newyork-hotel-1.jpg', proveedorId: admin.id },
    { nombre: 'Cliff View Santorini', provincia: 'Santorini', distrito: 'Grecia', imagen: '/uploads/santorini-hotel-1.jpg', proveedorId: boutiqueAg.id },
    { nombre: 'Riad Yasmine', provincia: 'Marrakech', distrito: 'Marruecos', imagen: '/uploads/marrakech-hotel-1.jpg', proveedorId: boutiqueAg.id },
  ];

  const hospedajesCreated: any[] = [];
  for (const d of destinos) {
    // Hospedaje has no unique field other than id; we check by nombre as a workaround.
    const existing = await prisma.hospedaje.findFirst({ where: { nombre: d.nombre } });
    let h: any;
    if (existing) {
      h = existing;
    } else {
      h = await prisma.hospedaje.create({
        data: {
          nombre: d.nombre,
          descripcion: `${d.nombre} en ${d.provincia}, ${d.distrito}. Hotel boutique con encanto local.`,
          direccion: `${d.provincia}, ${d.distrito}`,
          provincia: d.provincia,
          distrito: d.distrito,
          corregimiento: d.provincia,
          imagenes: [d.imagen],
          imagenPrincipal: d.imagen,
          amenidades: ['WiFi', 'Desayuno', 'Aire acondicionado'],
          proveedorId: d.proveedorId,
          isFeatured: true,
          activo: true,
        },
      });
    }
    hospedajesCreated.push(h);
  }
  console.log(`Hospedajes OK (${hospedajesCreated.length})`);

  // --- Habitaciones (2 per hotel) + Tarifas (3 temporadas) ---
  for (const h of hospedajesCreated) {
    const existing = await prisma.habitacion.findFirst({ where: { hospedajeId: h.id } });
    if (existing) continue;

    const doble = await prisma.habitacion.create({
      data: {
        hospedajeId: h.id,
        nombre: 'Doble Estandar',
        tipo: 'DOBLE',
        capacidad: 2,
        descripcion: 'Habitacion doble comoda con cama matrimonial.',
        amenidades: ['WiFi', 'TV', 'Bano privado'],
        imagenes: [],
        activo: true,
      },
    });

    const suite = await prisma.habitacion.create({
      data: {
        hospedajeId: h.id,
        nombre: 'Suite Premium',
        tipo: 'SUITE',
        capacidad: 4,
        descripcion: 'Suite amplia con sala de estar.',
        amenidades: ['WiFi', 'TV', 'Bano privado', 'Minibar', 'Vista al exterior'],
        imagenes: [],
        activo: true,
      },
    });

    for (const t of ['ALTA', 'MEDIA', 'BAJA'] as const) {
      const baseDoble = t === 'ALTA' ? 220 : t === 'MEDIA' ? 180 : 140;
      await prisma.tarifaHospedaje.create({
        data: {
          hospedajeId: h.id,
          habitacionId: doble.id,
          temporada: t,
          precioNoche: baseDoble,
          moneda: 'USD',
          fechaInicio: yearStart,
          fechaFin: yearEnd,
          activo: true,
        },
      });
      await prisma.tarifaHospedaje.create({
        data: {
          hospedajeId: h.id,
          habitacionId: suite.id,
          temporada: t,
          precioNoche: baseDoble + 140,
          moneda: 'USD',
          fechaInicio: yearStart,
          fechaFin: yearEnd,
          activo: true,
        },
      });
    }
  }
  console.log('Habitaciones + Tarifas OK');

  // --- Actividades (1 per destino) + Tarifas ---
  // UUIDs deterministas de las 6 categorías sembradas en la migración actividades_v2:
  const CAT_AVENTURA = '00000000-0000-0000-0000-000000000001';
  const CAT_CULTURAL = '00000000-0000-0000-0000-000000000002';
  const CAT_GASTRONOMICA = '00000000-0000-0000-0000-000000000003';
  const CAT_NATURALEZA = '00000000-0000-0000-0000-000000000004';
  const CAT_EDUCATIVA = '00000000-0000-0000-0000-000000000005';
  const CAT_DEPORTIVA = '00000000-0000-0000-0000-000000000006';

  function slugifyActividad(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  const actividadesSeed = [
    { nombre: 'Tour Torre Eiffel', categoriaId: CAT_CULTURAL, ubicacion: 'Paris', provincia: 'Paris', distrito: 'Francia', precio: 80, featured: true, imagen: '/uploads/paris-activity-1.jpg', proveedorId: parisProv.id },
    { nombre: 'Coliseo y Foro', categoriaId: CAT_CULTURAL, ubicacion: 'Roma', provincia: 'Roma', distrito: 'Italia', precio: 90, featured: true, imagen: '/uploads/roma-activity-1.jpg', proveedorId: parisProv.id },
    { nombre: 'Templo Sensoji', categoriaId: CAT_CULTURAL, ubicacion: 'Tokio', provincia: 'Tokio', distrito: 'Japon', precio: 70, featured: true, imagen: '/uploads/tokio-activity-1.jpg', proveedorId: asiaProv.id },
    { nombre: 'Estatua de la Libertad', categoriaId: CAT_CULTURAL, ubicacion: 'Nueva York', provincia: 'Nueva York', distrito: 'EE.UU.', precio: 95, featured: false, imagen: '/uploads/newyork-activity-1.jpg', proveedorId: admin.id },
    { nombre: 'Atardecer en Oia', categoriaId: CAT_NATURALEZA, ubicacion: 'Santorini', provincia: 'Santorini', distrito: 'Grecia', precio: 60, featured: false, imagen: '/uploads/santorini-activity-1.jpg', proveedorId: boutiqueAg.id },
    { nombre: 'Medina y Zoco', categoriaId: CAT_CULTURAL, ubicacion: 'Marrakech', provincia: 'Marrakech', distrito: 'Marruecos', precio: 55, featured: false, imagen: '/uploads/marrakech-activity-1.jpg', proveedorId: boutiqueAg.id },
  ];

  const actividadesCreated: any[] = [];
  for (const a of actividadesSeed) {
    const existing = await prisma.actividad.findFirst({ where: { nombre: a.nombre } });
    let act: any;
    if (existing) {
      act = existing;
    } else {
      const baseSlug = slugifyActividad(`${a.nombre} ${a.provincia}`);
      // Sufijo aleatorio corto para garantizar unicidad incluso en reseed
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
      act = await prisma.actividad.create({
        data: {
          nombre: a.nombre,
          slug,
          descripcion: `${a.nombre} en ${a.ubicacion}. Experiencia inolvidable.`,
          categoriaId: a.categoriaId,
          duracionHoras: 3,
          ubicacion: a.ubicacion,
          provincia: a.provincia,
          distrito: a.distrito,
          imagenPrincipal: a.imagen,
          imagenes: [a.imagen],
          incluye: ['Guia profesional', 'Entrada'],
          noIncluye: ['Comidas', 'Propinas'],
          requisitos: [],
          edadMinima: 0,
          capacidadMaxima: 20,
          estado: 'ACTIVE',
          proveedorId: a.proveedorId,
          isFeatured: a.featured,
        },
      });
      await prisma.tarifaActividad.create({
        data: {
          actividadId: act.id,
          temporada: 'ALTA',
          precioAdulto: a.precio,
          precioNino: Math.round(a.precio * 0.6 * 100) / 100,
          moneda: 'USD',
          fechaInicio: yearStart,
          fechaFin: yearEnd,
          activo: true,
        },
      });
    }
    actividadesCreated.push(act);
  }
  console.log(`Actividades + Tarifas OK (${actividadesCreated.length})`);

  // --- Vehiculos + Tarifas ---
  const vehiculosSeed = [
    { marca: 'Renault', modelo: 'Clio', placa: 'TD-CLIO', tipo: 'SEDAN' as const, capacidad: 4, precio: 60, imagen: '/uploads/vehicle-car.jpg', proveedorId: parisProv.id },
    { marca: 'Fiat', modelo: 'Doblo', placa: 'TD-DOBLO', tipo: 'VAN' as const, capacidad: 7, precio: 90, imagen: '/uploads/vehicle-van.jpg', proveedorId: parisProv.id },
    { marca: 'Toyota', modelo: 'RAV4', placa: 'TD-RAV4', tipo: 'SUV' as const, capacidad: 5, precio: 110, imagen: '/uploads/vehicle-suv.jpg', proveedorId: admin.id },
    { marca: 'Mercedes', modelo: 'Sprinter', placa: 'TD-SPRT', tipo: 'BUS' as const, capacidad: 15, precio: 180, imagen: '/uploads/vehicle-minibus.jpg', proveedorId: boutiqueAg.id },
  ];

  const vehiculosCreated: any[] = [];
  for (const v of vehiculosSeed) {
    const existing = await prisma.vehiculo.findUnique({ where: { placa: v.placa } });
    let veh: any;
    if (existing) {
      veh = existing;
    } else {
      veh = await prisma.vehiculo.create({
        data: {
          marca: v.marca,
          modelo: v.modelo,
          anio: 2023,
          placa: v.placa,
          tipo: v.tipo,
          capacidadPasajeros: v.capacidad,
          caracteristicas: ['Aire acondicionado', 'GPS', 'Bluetooth'],
          imagenes: [v.imagen],
          seguroIncluido: true,
          activo: true,
          proveedorId: v.proveedorId,
          isFeatured: true,
        },
      });
      await prisma.tarifaVehiculo.create({
        data: {
          vehiculoId: veh.id,
          temporada: 'ALTA',
          precioDia: v.precio,
          precioSemana: Math.round(v.precio * 6.5 * 100) / 100,
          deposito: Math.round(v.precio * 2 * 100) / 100,
          moneda: 'USD',
          fechaInicio: yearStart,
          fechaFin: yearEnd,
          activo: true,
        },
      });
    }
    vehiculosCreated.push(veh);
  }
  console.log(`Vehiculos + Tarifas OK (${vehiculosCreated.length})`);

  // --- Paquetes (3 featured) ---
  // We pick: doble habitacion of hotel + actividad + (optional) vehiculo
  const habs = await prisma.habitacion.findMany({
    where: {
      hospedaje: { nombre: { in: ['Le Marais Boutique', 'Trastevere Suites', 'Cliff View Santorini'] } },
    },
    include: { hospedaje: true },
  });

  function findHab(hospedajeName: string, tipo: 'DOBLE' | 'SUITE') {
    return habs.find((h) => h.hospedaje.nombre === hospedajeName && h.tipo === tipo);
  }

  const eiffel = actividadesCreated.find((a) => a.nombre === 'Tour Torre Eiffel');
  const coliseo = actividadesCreated.find((a) => a.nombre === 'Coliseo y Foro');
  const sprinter = vehiculosCreated.find((v) => v.placa === 'TD-DOBLO');

  const parisDoble = findHab('Le Marais Boutique', 'DOBLE');
  const romaDoble = findHab('Trastevere Suites', 'DOBLE');
  const santoriniSuite = findHab('Cliff View Santorini', 'SUITE');

  const paquetes = [
    parisDoble && eiffel ? {
      nombre: 'Paris Esencial',
      slug: 'paris-esencial',
      descripcion: 'Tres noches en Le Marais + tour por la Torre Eiffel. Una escapada perfecta para descubrir el corazon de Paris.',
      hospedajeId: parisDoble.hospedajeId,
      habitacionId: parisDoble.id,
      actividadId: eiffel.id,
      vehiculoId: null as string | null,
      diasDuracion: 3,
      noches: 3,
      descuentoPorcentaje: 10,
      imagenPrincipal: '/uploads/paquete-paris.jpg',
    } : null,
    romaDoble && coliseo ? {
      nombre: 'Roma Imperial',
      slug: 'roma-imperial',
      descripcion: 'Tres noches en Trastevere + Coliseo + van. Vive Roma como un local con transporte privado.',
      hospedajeId: romaDoble.hospedajeId,
      habitacionId: romaDoble.id,
      actividadId: coliseo.id,
      vehiculoId: sprinter?.id ?? null,
      diasDuracion: 3,
      noches: 3,
      descuentoPorcentaje: 15,
      imagenPrincipal: '/uploads/paquete-roma.jpg',
    } : null,
    santoriniSuite ? {
      nombre: 'Santorini Relax',
      slug: 'santorini-relax',
      descripcion: 'Cinco noches en suite Cliff View con vista al mar Egeo. El retiro mas romantico de Europa.',
      hospedajeId: santoriniSuite.hospedajeId,
      habitacionId: santoriniSuite.id,
      actividadId: null as string | null,
      vehiculoId: null as string | null,
      diasDuracion: 5,
      noches: 5,
      descuentoPorcentaje: 5,
      imagenPrincipal: '/uploads/paquete-santorini.jpg',
    } : null,
  ].filter((p): p is NonNullable<typeof p> => p !== null);

  for (const p of paquetes) {
    await prisma.paquete.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        nombre: p.nombre,
        slug: p.slug,
        descripcion: p.descripcion,
        hospedajeId: p.hospedajeId,
        habitacionId: p.habitacionId,
        actividadId: p.actividadId ?? undefined,
        vehiculoId: p.vehiculoId ?? undefined,
        diasDuracion: p.diasDuracion,
        noches: p.noches,
        descuentoPorcentaje: p.descuentoPorcentaje,
        imagenPrincipal: p.imagenPrincipal,
        isFeatured: true,
        isActive: true,
        validoDesde: now,
        validoHasta: validUntil,
        proveedorId: admin.id,
      },
    });
  }
  console.log(`Paquetes OK (${paquetes.length})`);

  console.log('');
  console.log('Seed completo. Credenciales:');
  console.log('  ADMIN: admin@turidove.com / Admin123!');
  console.log('  PROVEEDOR: paris.provider@turidove.com / Provider123!');
  console.log('  CLIENTE: cliente1@example.com / Client123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    void prisma.$disconnect();
  });
