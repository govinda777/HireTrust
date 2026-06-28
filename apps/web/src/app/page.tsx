'use client';

import { useState } from 'react';

export default function Home() {
  const [providerId, setProviderId] = useState('');
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [agreementId, setAgreementId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/agreements', {
      method: 'POST',
      body: JSON.stringify({
        providerId,
        subscriberId: 'current-user-id', // Will replace with Privy later
        price,
        termsHash: 'some-hash'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    setAgreementId(data.agreementId);
    setLoading(false);
  };

  return (
    <main className="p-24">
      <h1 className="text-4xl font-bold mb-8">HireTrust - Cartório Digital</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block">Provider Address</label>
          <input
            type="text"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="w-full border p-2 text-black"
          />
        </div>
        <div>
          <label className="block">Price (BRL)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full border p-2 text-black"
          />
        </div>
        <button
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Creating...' : 'Register Agreement'}
        </button>
      </form>

      {agreementId && (
        <div className="mt-8 p-4 bg-green-100 text-green-800 rounded">
          Agreement Created! ID: {agreementId}
        </div>
      )}
    </main>
  );
}
