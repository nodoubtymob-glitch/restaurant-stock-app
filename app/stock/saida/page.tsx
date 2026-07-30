import PageHeader from '@/components/ui/PageHeader'
import StockMovementForm from '@/components/stock/StockMovementForm'

export default function SaidaPage() {
  return (
    <div>
      <PageHeader
        title="Registrar saída"
        subtitle="Baixa de produtos vendidos ou consumidos"
      />
      <StockMovementForm movementType="saída" />
    </div>
  )
}
