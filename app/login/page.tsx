import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🍽️ Stock Control
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Controle de Estoque
            </p>
          </div>

          <LoginForm />

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm text-gray-600 dark:text-gray-300">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p>Email: admin@test.com</p>
            <p>Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
