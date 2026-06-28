import { PrismaClient } from '@hiretrust/database';
import { GetSubscriptionStatusQuery } from '../queries/get-subscription-status.query';

export class GetSubscriptionStatusHandler {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(query: GetSubscriptionStatusQuery) {
    return this.prisma.subscription.findUnique({
      where: { id: query.subscriptionId },
      include: {
        cycles: {
          orderBy: { cycleNumber: 'desc' },
          take: 1
        }
      }
    });
  }
}
