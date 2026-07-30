import PageHeader from '@/components/ui/PageHeader'
import QuickSaida from '@/components/stock/QuickSaida'

export default function SaidaPage() {
  return (
    <div>
      <PageHeader
        title="Registrar saída"
        subtitle="Toque no produto e confirme a quantidade"
      />
      <QuickSaida />
    </div>
  )
}
