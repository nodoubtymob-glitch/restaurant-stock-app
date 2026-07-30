import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* ambient ember glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-ember-500/20 blur-[120px]" />

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-ember shadow-glow">
            <span className="text-3xl">🔥</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Brasaroots Control</h1>
          <p className="mt-1 text-sm text-coal-100/50">
            Estoque e faturamento do seu bar
          </p>
        </div>

        <div className="card p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-coal-100/30">
          Acesso restrito · fale com o administrador para obter seu login
        </p>
      </div>
    </div>
  )
}
