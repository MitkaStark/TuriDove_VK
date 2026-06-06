import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { EmailSendProcessor } from './email-send.processor';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: 'emails' })],
  controllers: [MailController],
  providers: [MailService, EmailSendProcessor],
  exports: [MailService, BullModule],
})
export class MailModule {}
