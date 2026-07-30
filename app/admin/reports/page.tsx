export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Relatórios
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Análise detalhada de faturamento e estoque
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Faturamento por Período
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Análise de receitas e custos
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Produtos Mais Vendidos
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Top 10 produtos por volume
          </p>
        </div>
      </div>
    </div>
  )
}
