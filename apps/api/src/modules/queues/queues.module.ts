import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QUEUE_NOTIFICATION, QUEUE_FOLLOWUP } from "./queue.constants";
import { NotificationProducer } from "./producers/notification.producer";
import { FollowupProducer } from "./producers/followup.producer";
import { NotificationConsumer } from "./consumers/notification.consumer";
import { FollowupConsumer } from "./consumers/followup.consumer";
import { Referral } from "../referrals/entities/referral.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>("redis.host"),
          port: config.get<number>("redis.port"),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NOTIFICATION },
      { name: QUEUE_FOLLOWUP },
    ),
    TypeOrmModule.forFeature([Referral]),
  ],
  providers: [
    NotificationProducer,
    FollowupProducer,
    NotificationConsumer,
    FollowupConsumer,
  ],
  exports: [NotificationProducer, FollowupProducer],
})
export class QueuesModule {}
