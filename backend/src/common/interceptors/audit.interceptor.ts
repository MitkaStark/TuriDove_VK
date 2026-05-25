import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditoriaService } from '../../modules/auditoria/auditoria.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit write operations
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip auth and uploads
    const url = request.url || '';
    if (url.includes('/auth/') || url.includes('/uploads/')) {
      return next.handle();
    }

    const user = request.user;
    if (!user?.id) {
      return next.handle();
    }

    const accion = method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : 'UPDATE';
    const entidad = this.getEntidad(url);
    const ip = request.ip || request.headers?.['x-forwarded-for'] || '';

    return next.handle().pipe(
      tap((responseData) => {
        const entidadId = request.params?.id || request.params?.habId || request.params?.tarifaId || responseData?.data?.id || responseData?.id || '';

        const datos: any = { method, path: url };
        if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
          const body = { ...request.body };
          delete body.password;
          delete body.confirmPassword;
          datos.body = body;
        }

        this.auditoriaService.log({
          accion,
          entidad,
          entidadId: String(entidadId || 'unknown'),
          datos,
          userId: user.id,
          ip: typeof ip === 'string' ? ip : '',
        }).catch(() => {});
      }),
    );
  }

  private getEntidad(url: string): string {
    const path = url.replace(/^\/api\/v1\//, '').split('?')[0];
    const segments = path.split('/');
    const entity = segments[0] || 'unknown';

    const map: Record<string, string> = {
      hospedajes: 'Hospedaje', actividades: 'Actividad', transfers: 'Transfer',
      vehiculos: 'Vehiculo', reservas: 'Reserva', pagos: 'Pago', users: 'Usuario',
      financiero: 'Financiero', auditoria: 'Auditoria',
    };

    if (segments.length >= 3) {
      const sub = segments[2];
      if (sub === 'habitaciones') return 'Habitacion';
      if (sub === 'tarifas') return 'Tarifa';
      if (sub === 'estado' || sub === 'cancelar') return 'Reserva';
      if (sub === 'role') return 'Usuario';
      if (sub === 'reembolso') return 'Pago';
    }

    return map[entity] || entity;
  }
}
