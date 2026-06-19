export async function fetcher(...args) {
  try {
    const res = await fetch(...args)
    let data
    try {
      data = await res.json()
    } catch {
      data = {}
    }
    if (!res.ok) {
      const err = new Error(data.error || 'Erro ao carregar')
      err.status = res.status
      throw err
    }
    return data
  } catch (err) {
    if (err.status) throw err
    const networkErr = new Error('Erro de conexão. Verifique sua internet.')
    networkErr.status = 0
    throw networkErr
  }
}

export function userFetcher(url) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return fetcher(url, { headers })
}

export function adminFetcher(url) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return fetcher(url, { headers })
}
