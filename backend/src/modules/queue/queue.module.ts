import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: { count: 1000, age: 24 * 3600 },
          removeOnFail: { count: 5000, age: 7 * 24 * 3600 },
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
