'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'

const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'product-photos'

export default function PhotoUpload({
  value,
  onChange,
}: {
  value?: string | null
  onChange: (url: string | null) => void
}) {
  const supabase = createClient()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const pick = () => inputRef.current?.click()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 6 * 1024 * 1024) {
      toast.show('Imagem muito grande (máx 6MB)', 'error')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (error) throw error
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      onChange(data.publicUrl)
    } catch {
      toast.show('Falha ao enviar a foto', 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-coal-850">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Produto" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-2xl opacity-40">
            📷
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <Spinner />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <button type="button" className="btn-ghost" onClick={pick} disabled={uploading}>
          {value ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        {value && (
          <button
            type="button"
            className="text-xs text-coal-100/40 hover:text-red-300"
            onClick={() => onChange(null)}
          >
            Remover
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
