import * as amqp from 'amqplib';

export class RabbitMQAdapter {
  private connection?: any;
  private channel?: any;

  constructor(private readonly url: string) {}

  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();
  }

  async publish(exchange: string, routingKey: string, content: any): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(content)));
  }

  async subscribe(exchange: string, queue: string, routingKey: string, onMessage: (msg: any) => void): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    const q = await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(q.queue, exchange, routingKey);

    this.channel.consume(q.queue, (msg: any) => {
      if (msg) {
        onMessage(JSON.parse(msg.content.toString()));
        this.channel?.ack(msg);
      }
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
