import { NextResponse } from 'next/server';
import { StarkBankAdapter } from '../../../../infrastructure/adapters/starkbank-adapter';
import { RequestPaymentHandler } from '../../../../application/use-cases/request-payment';

export const dynamic = 'force-dynamic';

const starkbank = new StarkBankAdapter(
  process.env.STARKBANK_PROJECT_ID || 'dummy-project-id',
  process.env.STARKBANK_PRIVATE_KEY || 'dummy-private-key',
  'sandbox'
);

export async function POST(req: Request) {
  const body = await req.json();
  const handler = new RequestPaymentHandler(starkbank);

  try {
    const pixData = await handler.execute(body);
    return NextResponse.json(pixData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
