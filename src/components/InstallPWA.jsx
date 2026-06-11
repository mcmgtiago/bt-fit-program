import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPWA() {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShow(false)
    setPrompt(null)
  }

  if (installed || !show) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-xl flex items-center gap-3">
      <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0">
        <Download size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">Instalar B&T Fit</p>
        <p className="text-zinc-400 text-xs">Adicionar à tela inicial</p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shrink-0"
      >
        Instalar
      </button>
      <button onClick={() => setShow(false)} className="text-zinc-500">
        <X size={18} />
      </button>
    </div>
  )
}
