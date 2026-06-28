import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">HireTrust</h1>
      <Link href="/dashboard/provider" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
        Ir para Dashboard do Prestador
      </Link>
    </div>
  );
}
