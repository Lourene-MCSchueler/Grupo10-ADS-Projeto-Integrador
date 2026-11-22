// Chamadas à API. O Vite faz proxy de /api para http://localhost:3001.

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function parseError(response) {
  const data = await response.json().catch(() => null)
  return new ApiError(
    data?.erro || data?.message || 'Não foi possível concluir a operação.',
    response.status,
  )
}

export async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) throw await parseError(response)

  return response.json().catch(() => null)
}

// Baixa um arquivo (ex.: planilha .xlsx) usando o nome enviado no Content-Disposition.
export async function downloadFile(path, fallbackName) {
  const response = await fetch(path, { credentials: 'include' })

  if (!response.ok) throw await parseError(response)

  const disposition = response.headers.get('Content-Disposition') || ''
  const fileName = disposition.match(/filename="?([^"]+)"?/)?.[1] || fallbackName

  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  return fileName
}

// Monta a query string ignorando filtros vazios.
export function buildQuery(params) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') query.set(key, value)
  }
  const text = query.toString()
  return text ? `?${text}` : ''
}
