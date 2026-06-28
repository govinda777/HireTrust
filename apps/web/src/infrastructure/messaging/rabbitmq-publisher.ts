import amqp from 'amqplib';
import { IEvent } from '@hiretrust/shared';

export class RabbitMQPublisher {
  private connection?: any;
  private channel?: any;

  constructor(private url: string) {}

  async connect() {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('hiretrust_events', 'fanout', { durable: true });
  }

  async publish(event: IEvent) {
    if (!this.channel) throw new Error('Channel not initialized');
    this.channel.publish('hiretrust_events', '', Buffer.from(JSON.stringify(event)));
  }
}
