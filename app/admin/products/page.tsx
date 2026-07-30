export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Produtos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie todos os produtos do estoque
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Novo Produto
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum produto cadastrado ainda.
        </p>
      </div>
    </div>
  )
}
