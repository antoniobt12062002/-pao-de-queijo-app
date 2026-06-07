type Props = { message?: string; onRetry?: () => void }

export default function ErrorMessage({
  message = 'Algo deu errado.',
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center px-4">
      <p className="text-gray-600 text-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-amber-500 text-sm font-medium underline">
          Tentar novamente
        </button>
      )}
    </div>
  )
}
