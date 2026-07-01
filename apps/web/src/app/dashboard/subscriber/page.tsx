import React from 'react';

// This is a simplified Server Component for the demo
export default async function SubscriberDashboard() {
  // In a real scenario, we would call the Query Handlers here
  const subscription = {
    id: 'sub-123',
    status: 'ACTIVE',
    nextBillingDate: '2024-05-20',
    price: '100.00',
    healthScore: 98 // Simulating new health score metric
  };

  const cycles = [
    { id: 'sub123_cycle2', number: 2, status: 'IN_ESCROW', dueDate: '2024-04-20', proofHash: null, performance: 'Verifying...' },
    { id: 'sub123_cycle1', number: 1, status: 'RELEASED', dueDate: '2024-03-20', proofHash: '0xabc...def', performance: '100% Uptime' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Meu Plano HireTrust</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm">Status da Assinatura</p>
          <p className="text-xl font-semibold text-green-600">{subscription.status}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm">Próximo Vencimento</p>
          <p className="text-xl font-semibold">{subscription.nextBillingDate}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm">Valor Mensal</p>
          <p className="text-xl font-semibold">ETH {subscription.price}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm">Health Score (SLA)</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold">{subscription.healthScore}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${subscription.healthScore}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Histórico de Faturamento & Ciclos</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciclo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance (Oracle)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prova de Serviço (PoS)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cycles.map((cycle) => (
              <tr key={cycle.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{cycle.number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cycle.dueDate}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    cycle.status === 'RELEASED' ? 'bg-blue-100 text-blue-800' :
                    cycle.status === 'IN_ESCROW' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {cycle.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cycle.performance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {cycle.proofHash || 'Aguardando...'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
