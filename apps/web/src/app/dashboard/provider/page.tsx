"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, Send, Clock } from 'lucide-react';

export default function ProviderDashboard() {
  const [agreements, setAgreements] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, fetch from Read Model API
    setAgreements([
      { id: 'agreement-1', status: 'ACTIVE', subscriberId: 'user-sub-1', termsHash: 'terms-001' },
      { id: 'agreement-2', status: 'PENDING', subscriberId: 'user-sub-2', termsHash: 'terms-002' }
    ]);
  }, []);

  const handleSubmitProof = async (agreementId: string) => {
    const proofHash = '0x' + Math.random().toString(16).slice(2);
    const response = await fetch('/api/agreements/submit-proof', {
      method: 'POST',
      body: JSON.stringify({ agreementId, proofHash }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      alert('Prova enviada com sucesso! O pagamento será liberado on-chain.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard do Prestador</h1>

      <div className="grid gap-4">
        {agreements.map((agreement) => (
          <div key={agreement.id} className="border p-4 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="font-semibold">{agreement.id}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {agreement.status === 'ACTIVE' ? (
                  <span className="text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Ativo</span>
                ) : (
                  <span className="text-yellow-600 flex items-center gap-1"><Clock size={16} /> Pendente (Aguardando PIX)</span>
                )}
              </div>
            </div>

            {agreement.status === 'ACTIVE' && (
              <button
                onClick={() => handleSubmitProof(agreement.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
              >
                <Send size={16} /> Enviar Prova de Serviço
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
