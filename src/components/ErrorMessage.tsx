import { AlertCircle } from 'lucide-react'

type Props = { message?: string; onRetry?: () => void }

export default function ErrorMessage({
  message = 'Algo deu errado.',
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center px-4">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <p className="text-gray-600 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-amber-600 text-sm font-medium bg-amber-50 px-4 py-1.5 rounded-xl hover:bg-amber-100 transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
