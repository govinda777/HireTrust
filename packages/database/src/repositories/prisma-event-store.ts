import { PrismaClient } from '@prisma/client';
import { IEvent } from '@hiretrust/shared';

export class PrismaEventStore {
  constructor(private prisma: PrismaClient) {}

  async save(event: IEvent): Promise<void> {
    await this.prisma.event.create({
      data: {
        type: event.type,
        data: event.data,
        createdAt: event.occurredAt,
      },
    });
  }

  async getEventsByAgreementId(agreementId: string): Promise<any[]> {
    // In a real Event Store, we would filter by a stream ID
    // For simplicity in v0.1, we filter within the JSON data if needed
    // or just return all events if this were a small demo
    return this.prisma.event.findMany({
      where: {
        data: {
          path: ['agreementId'],
          equals: agreementId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
