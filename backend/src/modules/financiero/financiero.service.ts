import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReporteQueryDto } from './dto/reporte-query.dto';

@Injectable()
export class FinancieroService {
  private readonly logger = new Logger(FinancieroService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getResumen(query: ReporteQueryDto) {
    const [reservas, pagos, hospedajes, actividades, transfers, vehiculos] = await Promise.all([
      this.prisma.reserva.findMany({ include: { reservaHospedajes: true, reservaActividades: true, reservaTransfers: true, reservaVehiculos: true } }),
      this.prisma.pago.findMany(),
      this.prisma.hospedaje.count(),
      this.prisma.actividad.count(),
      this.prisma.transfer.count(),
      this.prisma.vehiculo.count(),
    ]);

    const totalIngresos = pagos.filter(p => p.estado === 'COMPLETADO').reduce((s, p) => s + Number(p.monto), 0);
    const ingresosHosp = reservas.reduce((s, r) => s + r.reservaHospedajes.reduce((ss, rh) => ss + Number(rh.precioTotal), 0), 0);
    const ingresosAct = reservas.reduce((s, r) => s + r.reservaActividades.reduce((ss, ra) => ss + Number(ra.precioTotal), 0), 0);
    const ingresosTrans = reservas.reduce((s, r) => s + r.reservaTransfers.reduce((ss, rt) => ss + Number(rt.precioTotal), 0), 0);
    const ingresosVeh = reservas.reduce((s, r) => s + r.reservaVehiculos.reduce((ss, rv) => ss + Number(rv.precioTotal), 0), 0);

    return {
      periodo: { inicio: query.fechaInicio || 'all-time', fin: query.fechaFin || 'now' },
      recursos: { hospedajes, actividades, transfers, vehiculos },
      ingresos: { total: totalIngresos, hospedajes: ingresosHosp, actividades: ingresosAct, transfers: ingresosTrans, vehiculos: ingresosVeh },
      reservas: {
        total: reservas.length,
        confirmadas: reservas.filter(r => r.estado === 'CONFIRMADA').length,
        pendientes: reservas.filter(r => r.estado === 'PENDIENTE').length,
        completadas: reservas.filter(r => r.estado === 'COMPLETADA').length,
        canceladas: reservas.filter(r => r.estado === 'CANCELADA').length,
      },
      pagos: {
        total: pagos.length,
        completados: pagos.filter(p => p.estado === 'COMPLETADO').length,
        montoTotal: totalIngresos,
      },
    };
  }

  async getIngresosPorMes(year: number) {
    const pagos = await this.prisma.pago.findMany({
      where: {
        estado: 'COMPLETADO',
        createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
      },
    });

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    return meses.map((mes, index) => {
      const pagosMes = pagos.filter(p => p.createdAt.getMonth() === index);
      return {
        mes,
        mesNumero: index + 1,
        ingresos: pagosMes.reduce((s, p) => s + Number(p.monto), 0),
        pagos: pagosMes.length,
      };
    });
  }

  async getReporteProveedores(query: ReporteQueryDto) {
    const proveedores = await this.prisma.user.findMany({
      where: { role: { in: ['PROVEEDOR', 'AGENCIA'] } },
      select: {
        id: true, nombre: true, apellido: true, email: true, role: true,
        hospedajes: { select: { id: true } },
        actividades: { select: { id: true } },
        transfers: { select: { id: true } },
        vehiculos: { select: { id: true } },
      },
    });

    return {
      proveedores: proveedores.map(p => ({
        id: p.id,
        nombre: `${p.nombre} ${p.apellido}`,
        email: p.email,
        role: p.role,
        hospedajes: p.hospedajes.length,
        actividades: p.actividades.length,
        transfers: p.transfers.length,
        vehiculos: p.vehiculos.length,
        totalRecursos: p.hospedajes.length + p.actividades.length + p.transfers.length + p.vehiculos.length,
      })),
    };
  }

  async getOcupacion(query: ReporteQueryDto) {
    const habitaciones = await this.prisma.habitacion.findMany({ where: { activo: true } });
    return {
      habitacionesDisponibles: habitaciones.length,
      habitacionesActivas: habitaciones.filter(h => h.activo).length,
    };
  }
}
