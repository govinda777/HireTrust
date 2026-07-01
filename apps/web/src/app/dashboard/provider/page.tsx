"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, BarChart3 } from 'lucide-react';

export default function ProviderDashboard() {
  const [agreements, setAgreements] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, this would call a Query API route
    setAgreements([
      { id: 'agreement-1', status: 'ACTIVE', subscriberId: 'user-sub-1', healthScore: 100 },
      { id: 'agreement-2', status: 'PENDING', subscriberId: 'user-sub-2', healthScore: 100 }
    ]);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard do Prestador (Performance SLA)</h1>

      <div className="grid gap-4">
        {agreements.map((agreement) => (
          <div key={agreement.id} className="border p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-lg">{agreement.id}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {agreement.status === 'ACTIVE' ? (
                    <span className="text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Ativo</span>
                  ) : (
                    <span className="text-yellow-600 flex items-center gap-1"><Clock size={16} /> Pendente</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500 flex items-center gap-1 justify-end">
                  <BarChart3 size={14} /> Health Score
                </p>
                <p className="text-2xl font-bold text-blue-600">{agreement.healthScore}%</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <p className="text-sm text-blue-800 font-medium mb-1">Status da Automação</p>
              <p className="text-xs text-blue-600">
                O Oracle Service está monitorando este contrato em tempo real.
                A Prova de Serviço (PoS) e a liberação de fundos ocorrerão automaticamente ao final de cada ciclo.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
