import { PrismaClient } from '@hiretrust/database';
import { GetProviderAgreementsQuery } from '../queries/get-provider-agreements.query';

export class GetProviderAgreementsHandler {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(query: GetProviderAgreementsQuery) {
    return this.prisma.agreement.findMany({
      where: { providerId: query.providerId }
    });
  }
}
