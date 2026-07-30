export default function UnitsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Unidades de Medida
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            kg, litro, unidade, garrafa, caixa...
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Nova Unidade
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Nenhuma unidade cadastrada.
        </p>
      </div>
    </div>
  )
}
