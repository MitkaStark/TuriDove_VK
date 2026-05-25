import { PrismaClient, Role, TipoHabitacion, TipoActividad, TipoVehiculo, TipoTransfer, Temporada } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Seeding database...');

  // ──────────────────────────────────────────────
  // Users
  // ──────────────────────────────────────────────

  const hashedPassword = await hashPassword('admin123');
  const hashedUser = await hashPassword('user123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@agroturismo.pa' },
    update: {},
    create: {
      email: 'admin@agroturismo.pa',
      password: hashedPassword,
      nombre: 'Admin',
      apellido: 'Sistema',
      telefono: '+507-6000-0001',
      role: Role.ADMIN,
    },
  });

  const proveedor1 = await prisma.user.upsert({
    where: { email: 'finca.loma@agroturismo.pa' },
    update: {},
    create: {
      email: 'finca.loma@agroturismo.pa',
      password: hashedUser,
      nombre: 'Carlos',
      apellido: 'Mendoza',
      telefono: '+507-6100-1001',
      role: Role.PROVEEDOR,
    },
  });

  const proveedor2 = await prisma.user.upsert({
    where: { email: 'aventura.chiriqui@agroturismo.pa' },
    update: {},
    create: {
      email: 'aventura.chiriqui@agroturismo.pa',
      password: hashedUser,
      nombre: 'Maria',
      apellido: 'Castillo',
      telefono: '+507-6100-2002',
      role: Role.PROVEEDOR,
    },
  });

  const agencia = await prisma.user.upsert({
    where: { email: 'agencia.panama@agroturismo.pa' },
    update: {},
    create: {
      email: 'agencia.panama@agroturismo.pa',
      password: hashedUser,
      nombre: 'Roberto',
      apellido: 'Gonzalez',
      telefono: '+507-6200-3003',
      role: Role.AGENCIA,
    },
  });

  const operador = await prisma.user.upsert({
    where: { email: 'operador@agroturismo.pa' },
    update: {},
    create: {
      email: 'operador@agroturismo.pa',
      password: hashedUser,
      nombre: 'Luis',
      apellido: 'Herrera',
      telefono: '+507-6300-4004',
      role: Role.OPERADOR,
    },
  });

  const cliente1 = await prisma.user.upsert({
    where: { email: 'juan.perez@gmail.com' },
    update: {},
    create: {
      email: 'juan.perez@gmail.com',
      password: hashedUser,
      nombre: 'Juan',
      apellido: 'Perez',
      telefono: '+507-6400-5005',
      role: Role.CLIENTE,
    },
  });

  const cliente2 = await prisma.user.upsert({
    where: { email: 'ana.rodriguez@gmail.com' },
    update: {},
    create: {
      email: 'ana.rodriguez@gmail.com',
      password: hashedUser,
      nombre: 'Ana',
      apellido: 'Rodriguez',
      telefono: '+507-6400-6006',
      role: Role.CLIENTE,
    },
  });

  console.log('Users created.');

  // ──────────────────────────────────────────────
  // Hospedajes - Proveedor 1
  // ──────────────────────────────────────────────

  const hospedaje1 = await prisma.hospedaje.create({
    data: {
      nombre: 'Finca Loma Verde',
      descripcion: 'Finca cafetalera con vista panoramica al valle de Boquete. Rodeada de naturaleza y cultivos organicos.',
      direccion: 'Calle principal de Palmira, Boquete',
      provincia: 'Chiriqui',
      distrito: 'Boquete',
      corregimiento: 'Palmira',
      latitud: 8.7833,
      longitud: -82.4333,
      imagenes: ['finca-loma-1.jpg', 'finca-loma-2.jpg', 'finca-loma-3.jpg'],
      amenidades: ['WiFi', 'Estacionamiento', 'Desayuno incluido', 'Tour de cafe', 'Jardin'],
      politicas: 'No se permiten mascotas. Check-in flexible previa coordinacion.',
      checkIn: '14:00',
      checkOut: '11:00',
      proveedorId: proveedor1.id,
    },
  });

  const hab1_1 = await prisma.habitacion.create({
    data: {
      nombre: 'Cabana El Cafetal',
      tipo: TipoHabitacion.DOBLE,
      capacidad: 2,
      descripcion: 'Cabana rustica con vista al cafetal, cama queen y bano privado.',
      amenidades: ['Bano privado', 'Agua caliente', 'Terraza', 'Vista al valle'],
      imagenes: ['cabana-cafetal-1.jpg', 'cabana-cafetal-2.jpg'],
      hospedajeId: hospedaje1.id,
    },
  });

  const hab1_2 = await prisma.habitacion.create({
    data: {
      nombre: 'Suite Familiar El Mirador',
      tipo: TipoHabitacion.FAMILIAR,
      capacidad: 5,
      descripcion: 'Suite amplia con sala, dos habitaciones y vista panoramica.',
      amenidades: ['Bano privado', 'Cocina', 'Sala', 'Terraza', 'Chimenea'],
      imagenes: ['suite-mirador-1.jpg', 'suite-mirador-2.jpg'],
      hospedajeId: hospedaje1.id,
    },
  });

  await prisma.tarifaHospedaje.createMany({
    data: [
      {
        hospedajeId: hospedaje1.id,
        habitacionId: hab1_1.id,
        temporada: Temporada.ALTA,
        precioNoche: 95.00,
        precioPersonaExtra: 25.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-03-31'),
      },
      {
        hospedajeId: hospedaje1.id,
        habitacionId: hab1_1.id,
        temporada: Temporada.BAJA,
        precioNoche: 65.00,
        precioPersonaExtra: 15.00,
        fechaInicio: new Date('2026-04-01'),
        fechaFin: new Date('2026-11-30'),
      },
      {
        hospedajeId: hospedaje1.id,
        habitacionId: hab1_2.id,
        temporada: Temporada.ALTA,
        precioNoche: 150.00,
        precioPersonaExtra: 30.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-03-31'),
      },
      {
        hospedajeId: hospedaje1.id,
        habitacionId: hab1_2.id,
        temporada: Temporada.BAJA,
        precioNoche: 110.00,
        precioPersonaExtra: 20.00,
        fechaInicio: new Date('2026-04-01'),
        fechaFin: new Date('2026-11-30'),
      },
    ],
  });

  // ──────────────────────────────────────────────
  // Hospedajes - Proveedor 2
  // ──────────────────────────────────────────────

  const hospedaje2 = await prisma.hospedaje.create({
    data: {
      nombre: 'Eco Lodge Rio Sereno',
      descripcion: 'Lodge ecologico a orillas del rio, con acceso a senderos naturales y avistamiento de aves.',
      direccion: 'Via principal Rio Sereno, a 2 km del centro',
      provincia: 'Chiriqui',
      distrito: 'Renacimiento',
      corregimiento: 'Rio Sereno',
      latitud: 8.8500,
      longitud: -82.8500,
      imagenes: ['eco-lodge-1.jpg', 'eco-lodge-2.jpg'],
      amenidades: ['WiFi', 'Restaurante', 'Senderos', 'Avistamiento de aves', 'Kayak'],
      politicas: 'Mascotas permitidas con suplemento. Zona libre de humo.',
      checkIn: '15:00',
      checkOut: '12:00',
      proveedorId: proveedor2.id,
    },
  });

  const hab2_1 = await prisma.habitacion.create({
    data: {
      nombre: 'Habitacion Individual Rio',
      tipo: TipoHabitacion.INDIVIDUAL,
      capacidad: 1,
      descripcion: 'Habitacion con vista al rio, ideal para viajeros solitarios.',
      amenidades: ['Bano privado', 'Agua caliente', 'Hamaca'],
      imagenes: ['hab-rio-1.jpg'],
      hospedajeId: hospedaje2.id,
    },
  });

  const hab2_2 = await prisma.habitacion.create({
    data: {
      nombre: 'Suite Rio Sereno',
      tipo: TipoHabitacion.SUITE,
      capacidad: 3,
      descripcion: 'Suite premium con jacuzzi y balcon privado sobre el rio.',
      amenidades: ['Bano privado', 'Jacuzzi', 'Balcon', 'Minibar', 'TV'],
      imagenes: ['suite-rio-1.jpg', 'suite-rio-2.jpg'],
      hospedajeId: hospedaje2.id,
    },
  });

  await prisma.tarifaHospedaje.createMany({
    data: [
      {
        hospedajeId: hospedaje2.id,
        habitacionId: hab2_1.id,
        temporada: Temporada.ALTA,
        precioNoche: 55.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-03-31'),
      },
      {
        hospedajeId: hospedaje2.id,
        habitacionId: hab2_1.id,
        temporada: Temporada.BAJA,
        precioNoche: 40.00,
        fechaInicio: new Date('2026-04-01'),
        fechaFin: new Date('2026-11-30'),
      },
      {
        hospedajeId: hospedaje2.id,
        habitacionId: hab2_2.id,
        temporada: Temporada.ALTA,
        precioNoche: 180.00,
        precioPersonaExtra: 35.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-03-31'),
      },
      {
        hospedajeId: hospedaje2.id,
        habitacionId: hab2_2.id,
        temporada: Temporada.BAJA,
        precioNoche: 130.00,
        precioPersonaExtra: 25.00,
        fechaInicio: new Date('2026-04-01'),
        fechaFin: new Date('2026-11-30'),
      },
    ],
  });

  console.log('Hospedajes created.');

  // ──────────────────────────────────────────────
  // Actividades - Proveedor 1
  // ──────────────────────────────────────────────

  const actividad1 = await prisma.actividad.create({
    data: {
      nombre: 'Tour del Cafe - De la Semilla a la Taza',
      descripcion: 'Recorrido completo por la finca cafetalera: siembra, cosecha, proceso de secado, tostado y degustacion de cafe de especialidad.',
      tipo: TipoActividad.GASTRONOMICA,
      duracionHoras: 3.5,
      ubicacion: 'Finca Loma Verde, Palmira',
      provincia: 'Chiriqui',
      distrito: 'Boquete',
      imagenes: ['tour-cafe-1.jpg', 'tour-cafe-2.jpg', 'tour-cafe-3.jpg'],
      incluye: ['Guia bilingue', 'Degustacion de 5 cafes', 'Bolsa de cafe de regalo', 'Refrigerio'],
      noIncluye: ['Transporte al punto de encuentro', 'Propinas'],
      requisitos: ['Zapatos cerrados', 'Protector solar'],
      edadMinima: 6,
      capacidadMaxima: 20,
      proveedorId: proveedor1.id,
    },
  });

  const actividad2 = await prisma.actividad.create({
    data: {
      nombre: 'Senderismo Volcan Baru - Amanecer',
      descripcion: 'Ascenso nocturno al punto mas alto de Panama para ver el amanecer con vista a ambos oceanos.',
      tipo: TipoActividad.AVENTURA,
      duracionHoras: 10,
      ubicacion: 'Parque Nacional Volcan Baru',
      provincia: 'Chiriqui',
      distrito: 'Boquete',
      imagenes: ['volcan-baru-1.jpg', 'volcan-baru-2.jpg'],
      incluye: ['Guia certificado', 'Linterna', 'Snacks de energia', 'Entrada al parque'],
      noIncluye: ['Transporte', 'Equipo de camping', 'Comidas adicionales'],
      requisitos: ['Buena condicion fisica', 'Botas de senderismo', 'Ropa abrigada', 'Lampara frontal'],
      edadMinima: 14,
      capacidadMaxima: 12,
      proveedorId: proveedor1.id,
    },
  });

  await prisma.tarifaActividad.createMany({
    data: [
      {
        actividadId: actividad1.id,
        temporada: Temporada.ALTA,
        precioAdulto: 45.00,
        precioNino: 25.00,
        precioGrupo: 35.00,
        minimoPersonas: 2,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        actividadId: actividad1.id,
        temporada: Temporada.BAJA,
        precioAdulto: 35.00,
        precioNino: 20.00,
        precioGrupo: 28.00,
        minimoPersonas: 2,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        actividadId: actividad2.id,
        temporada: Temporada.ALTA,
        precioAdulto: 85.00,
        precioNino: 65.00,
        minimoPersonas: 4,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        actividadId: actividad2.id,
        temporada: Temporada.BAJA,
        precioAdulto: 70.00,
        precioNino: 55.00,
        minimoPersonas: 4,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
    ],
  });

  // ──────────────────────────────────────────────
  // Actividades - Proveedor 2
  // ──────────────────────────────────────────────

  const actividad3 = await prisma.actividad.create({
    data: {
      nombre: 'Rafting Rio Chiriqui Viejo',
      descripcion: 'Aventura de rafting clase III-IV por los rapidos del rio Chiriqui Viejo, rodeados de selva tropical.',
      tipo: TipoActividad.DEPORTIVA,
      duracionHoras: 4,
      ubicacion: 'Rio Chiriqui Viejo, Renacimiento',
      provincia: 'Chiriqui',
      distrito: 'Renacimiento',
      imagenes: ['rafting-1.jpg', 'rafting-2.jpg'],
      incluye: ['Equipo completo', 'Guia certificado', 'Seguro', 'Almuerzo', 'Transporte desde lodge'],
      noIncluye: ['Fotos profesionales', 'Propinas'],
      requisitos: ['Saber nadar', 'Mayor de 12 anos', 'Buena condicion fisica'],
      edadMinima: 12,
      capacidadMaxima: 16,
      proveedorId: proveedor2.id,
    },
  });

  const actividad4 = await prisma.actividad.create({
    data: {
      nombre: 'Avistamiento de Aves y Quetzal',
      descripcion: 'Recorrido guiado por senderos del bosque nuboso en busca del quetzal y otras aves endemicas.',
      tipo: TipoActividad.NATURALEZA,
      duracionHoras: 5,
      ubicacion: 'Bosque nuboso de Rio Sereno',
      provincia: 'Chiriqui',
      distrito: 'Renacimiento',
      imagenes: ['aves-1.jpg', 'aves-2.jpg'],
      incluye: ['Guia ornitologo', 'Binoculares', 'Desayuno de campo', 'Lista de aves'],
      noIncluye: ['Transporte', 'Camara fotografica'],
      requisitos: ['Zapatos de senderismo', 'Ropa de colores neutros'],
      edadMinima: 8,
      capacidadMaxima: 10,
      proveedorId: proveedor2.id,
    },
  });

  await prisma.tarifaActividad.createMany({
    data: [
      {
        actividadId: actividad3.id,
        temporada: Temporada.ALTA,
        precioAdulto: 95.00,
        precioNino: 70.00,
        minimoPersonas: 4,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        actividadId: actividad3.id,
        temporada: Temporada.BAJA,
        precioAdulto: 75.00,
        precioNino: 55.00,
        minimoPersonas: 4,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        actividadId: actividad4.id,
        temporada: Temporada.ALTA,
        precioAdulto: 60.00,
        precioNino: 35.00,
        minimoPersonas: 2,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        actividadId: actividad4.id,
        temporada: Temporada.BAJA,
        precioAdulto: 50.00,
        precioNino: 30.00,
        minimoPersonas: 2,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
    ],
  });

  console.log('Actividades created.');

  // ──────────────────────────────────────────────
  // Transfers - Proveedor 1
  // ──────────────────────────────────────────────

  const transfer1 = await prisma.transfer.create({
    data: {
      nombre: 'Aeropuerto David - Boquete',
      tipo: TipoTransfer.AEROPUERTO,
      origen: 'Aeropuerto Enrique Malek, David',
      destino: 'Boquete Centro',
      descripcion: 'Transfer privado desde el aeropuerto de David hasta Boquete con parada opcional.',
      distanciaKm: 45,
      duracionEstimada: '50 minutos',
      proveedorId: proveedor1.id,
    },
  });

  const transfer2 = await prisma.transfer.create({
    data: {
      nombre: 'Tour Panoramico Boquete',
      tipo: TipoTransfer.TOUR,
      origen: 'Boquete Centro',
      destino: 'Boquete Centro (circuito)',
      descripcion: 'Recorrido panoramico por los principales puntos de Boquete: miradores, jardines y cafetales.',
      distanciaKm: 30,
      duracionEstimada: '3 horas',
      proveedorId: proveedor1.id,
    },
  });

  await prisma.tarifaTransfer.createMany({
    data: [
      {
        transferId: transfer1.id,
        temporada: Temporada.ALTA,
        precioPorPersona: 25.00,
        precioVehiculo: 60.00,
        minimoPersonas: 1,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        transferId: transfer1.id,
        temporada: Temporada.BAJA,
        precioPorPersona: 20.00,
        precioVehiculo: 50.00,
        minimoPersonas: 1,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        transferId: transfer2.id,
        temporada: Temporada.ALTA,
        precioPorPersona: 40.00,
        precioVehiculo: 120.00,
        minimoPersonas: 2,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        transferId: transfer2.id,
        temporada: Temporada.BAJA,
        precioPorPersona: 30.00,
        precioVehiculo: 90.00,
        minimoPersonas: 2,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
    ],
  });

  // ──────────────────────────────────────────────
  // Transfers - Proveedor 2
  // ──────────────────────────────────────────────

  const transfer3 = await prisma.transfer.create({
    data: {
      nombre: 'Rio Sereno - Frontera Costa Rica',
      tipo: TipoTransfer.PUNTO_A_PUNTO,
      origen: 'Eco Lodge Rio Sereno',
      destino: 'Paso Canoas (frontera)',
      descripcion: 'Transporte directo hasta la frontera con Costa Rica.',
      distanciaKm: 55,
      duracionEstimada: '1 hora 15 minutos',
      proveedorId: proveedor2.id,
    },
  });

  await prisma.tarifaTransfer.createMany({
    data: [
      {
        transferId: transfer3.id,
        temporada: Temporada.ALTA,
        precioPorPersona: 30.00,
        precioVehiculo: 80.00,
        minimoPersonas: 1,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        transferId: transfer3.id,
        temporada: Temporada.BAJA,
        precioPorPersona: 25.00,
        precioVehiculo: 65.00,
        minimoPersonas: 1,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
    ],
  });

  console.log('Transfers created.');

  // ──────────────────────────────────────────────
  // Vehiculos - Proveedor 1
  // ──────────────────────────────────────────────

  const vehiculo1 = await prisma.vehiculo.create({
    data: {
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2024,
      placa: 'CHI-1234',
      tipo: TipoVehiculo.PICKUP,
      capacidadPasajeros: 4,
      caracteristicas: ['4x4', 'Aire acondicionado', 'GPS', 'Doble cabina'],
      imagenes: ['hilux-1.jpg', 'hilux-2.jpg'],
      seguroIncluido: true,
      proveedorId: proveedor1.id,
    },
  });

  const vehiculo2 = await prisma.vehiculo.create({
    data: {
      marca: 'Hyundai',
      modelo: 'H1',
      anio: 2023,
      placa: 'CHI-5678',
      tipo: TipoVehiculo.VAN,
      capacidadPasajeros: 11,
      caracteristicas: ['Aire acondicionado', 'GPS', 'USB', 'Portaequipaje'],
      imagenes: ['h1-1.jpg'],
      seguroIncluido: true,
      proveedorId: proveedor1.id,
    },
  });

  await prisma.tarifaVehiculo.createMany({
    data: [
      {
        vehiculoId: vehiculo1.id,
        temporada: Temporada.ALTA,
        precioDia: 75.00,
        precioSemana: 450.00,
        deposito: 200.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        vehiculoId: vehiculo1.id,
        temporada: Temporada.BAJA,
        precioDia: 55.00,
        precioSemana: 330.00,
        deposito: 200.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        vehiculoId: vehiculo2.id,
        temporada: Temporada.ALTA,
        precioDia: 120.00,
        precioSemana: 720.00,
        deposito: 300.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        vehiculoId: vehiculo2.id,
        temporada: Temporada.BAJA,
        precioDia: 90.00,
        precioSemana: 540.00,
        deposito: 300.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
    ],
  });

  // ──────────────────────────────────────────────
  // Vehiculos - Proveedor 2
  // ──────────────────────────────────────────────

  const vehiculo3 = await prisma.vehiculo.create({
    data: {
      marca: 'Mitsubishi',
      modelo: 'Montero Sport',
      anio: 2025,
      placa: 'CHI-9012',
      tipo: TipoVehiculo.SUV,
      capacidadPasajeros: 7,
      caracteristicas: ['4x4', 'Aire acondicionado', 'GPS', 'Camara de reversa', 'Bluetooth'],
      imagenes: ['montero-1.jpg', 'montero-2.jpg'],
      seguroIncluido: true,
      proveedorId: proveedor2.id,
    },
  });

  const vehiculo4 = await prisma.vehiculo.create({
    data: {
      marca: 'Toyota',
      modelo: 'Coaster',
      anio: 2023,
      placa: 'CHI-3456',
      tipo: TipoVehiculo.MINIBUS,
      capacidadPasajeros: 22,
      caracteristicas: ['Aire acondicionado', 'Microfono', 'Portaequipaje', 'Cortinas'],
      imagenes: ['coaster-1.jpg'],
      seguroIncluido: true,
      proveedorId: proveedor2.id,
    },
  });

  await prisma.tarifaVehiculo.createMany({
    data: [
      {
        vehiculoId: vehiculo3.id,
        temporada: Temporada.ALTA,
        precioDia: 95.00,
        precioSemana: 570.00,
        deposito: 250.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        vehiculoId: vehiculo3.id,
        temporada: Temporada.BAJA,
        precioDia: 70.00,
        precioSemana: 420.00,
        deposito: 250.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        vehiculoId: vehiculo4.id,
        temporada: Temporada.ALTA,
        precioDia: 200.00,
        precioSemana: 1200.00,
        deposito: 500.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
      {
        vehiculoId: vehiculo4.id,
        temporada: Temporada.BAJA,
        precioDia: 150.00,
        precioSemana: 900.00,
        deposito: 500.00,
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-12-31'),
      },
    ],
  });

  // Link vehicles to transfers
  await prisma.vehiculoTransfer.createMany({
    data: [
      { transferId: transfer1.id, vehiculoId: vehiculo1.id },
      { transferId: transfer1.id, vehiculoId: vehiculo2.id },
      { transferId: transfer2.id, vehiculoId: vehiculo2.id },
      { transferId: transfer3.id, vehiculoId: vehiculo3.id },
      { transferId: transfer3.id, vehiculoId: vehiculo4.id },
    ],
  });

  console.log('Vehiculos created.');

  console.log('Seed completed successfully!');
  console.log({
    users: { admin: admin.email, proveedor1: proveedor1.email, proveedor2: proveedor2.email, agencia: agencia.email, operador: operador.email, cliente1: cliente1.email, cliente2: cliente2.email },
    hospedajes: [hospedaje1.nombre, hospedaje2.nombre],
    actividades: [actividad1.nombre, actividad2.nombre, actividad3.nombre, actividad4.nombre],
    transfers: [transfer1.nombre, transfer2.nombre, transfer3.nombre],
    vehiculos: [`${vehiculo1.marca} ${vehiculo1.modelo}`, `${vehiculo2.marca} ${vehiculo2.modelo}`, `${vehiculo3.marca} ${vehiculo3.modelo}`, `${vehiculo4.marca} ${vehiculo4.modelo}`],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
