import amqp from 'amqplib';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@hiretrust/database';
import { AgreementProjection } from './projections/agreement-projection';
import { HardhatAdapter } from './infrastructure/blockchain/hardhat-adapter';

async function main() {
  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://local_user:local_password@localhost:5672';
  const RPC_URL = process.env.HARDHAT_RPC_URL || 'http://localhost:8545';
  const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat #0

  // Load ABI from shared location or blockchain package
  const abiPath = path.join(__dirname, '../../../../packages/blockchain/abi.json');
  if (!fs.existsSync(abiPath)) {
    console.error('ABI file not found at:', abiPath);
    process.exit(1);
  }
  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

  // Contract address should be injected after deploy
  const CONTRACT_ADDRESS = process.env.AGREEMENT_REGISTRY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  const prisma = new PrismaClient();
  const blockchain = new HardhatAdapter(RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS, abi);
  const projection = new AgreementProjection(prisma, blockchain);

  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange('hiretrust_events', 'fanout', { durable: true });
  const { queue } = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(queue, 'hiretrust_events', '');

  console.log('Worker started, waiting for events...');

  channel.consume(queue, async (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      try {
        await projection.handle(event);
        channel.ack(msg);
      } catch (err) {
        console.error('Error processing event:', err);
      }
    }
  });
}

main().catch(console.error);
