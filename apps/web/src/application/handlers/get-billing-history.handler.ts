import { PrismaClient } from '@hiretrust/database';
import { GetBillingHistoryQuery } from '../queries/get-billing-history.query';

export class GetBillingHistoryHandler {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(query: GetBillingHistoryQuery) {
    return this.prisma.billingCycle.findMany({
      where: { subscriptionId: query.subscriptionId },
      orderBy: { cycleNumber: 'desc' }
    });
  }
}
