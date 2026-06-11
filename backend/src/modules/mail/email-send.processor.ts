import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from './mail.service';
import { RenderedEmail } from './templates/render.util';

export interface SendEmailJob {
  to: string;
  email: RenderedEmail;
  template: string;
}

@Processor('emails')
export class EmailSendProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailSendProcessor.name);
  constructor(private readonly mail: MailService) {
    super();
  }

  async process(job: Job<SendEmailJob>): Promise<{ ok: boolean; id?: string }> {
    const { to, email, template } = job.data;
    const r = await this.mail.sendNow(to, email, template);
    if (!r.ok) {
      throw new Error(r.error ?? 'Error al enviar email');
    }
    this.logger.log(`Email ${template} enviado a ${to} (id: ${r.id})`);
    return { ok: true, id: r.id };
  }
}
