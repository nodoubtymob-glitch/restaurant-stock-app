import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* ambient lime glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-ember-500/25 blur-[120px]" />

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-coal-100 shadow-ink">
            <span className="h-5 w-5 rounded-full bg-ember-500 ring-[6px] ring-ember-500/25" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Brasaroots</h1>
          <p className="mt-1 text-sm font-medium text-coal-400">
            Controle de estoque do seu bar
          </p>
        </div>

        <div className="card p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs font-medium text-coal-400">
          Acesso restrito · fale com o administrador para obter seu login
        </p>
      </div>
    </div>
  )
}
