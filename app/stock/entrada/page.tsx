import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import PageHeader from '@/components/ui/PageHeader'
import StockMovementForm from '@/components/stock/StockMovementForm'

export default async function EntradaPage() {
  const profile = await getSessionProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/stock/saida')

  return (
    <div>
      <PageHeader
        title="Entrada de estoque"
        subtitle="Registre produtos recebidos / reposição"
      />
      <StockMovementForm movementType="entrada" />
    </div>
  )
}
