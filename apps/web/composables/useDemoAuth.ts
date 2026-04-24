export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin'
}

export function useDemoAuth() {
  const currentUser = useState<AuthUser | null>('demo-auth-user', () => null)
  const loaded = useState('demo-auth-loaded', () => false)
  const pending = useState('demo-auth-pending', () => false)

  async function fetchCurrentUser(force = false) {
    if (loaded.value && !force) {
      return currentUser.value
    }

    pending.value = true

    try {
      const response = await $fetch<{ user: AuthUser }>('/api/auth/me')
      currentUser.value = response.user
    } catch {
      currentUser.value = null
    } finally {
      loaded.value = true
      pending.value = false
    }

    return currentUser.value
  }

  async function login(input: { email: string, password: string }) {
    pending.value = true

    try {
      const response = await $fetch<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: input
      })
      currentUser.value = response.user
      loaded.value = true
      return response.user
    } finally {
      pending.value = false
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    currentUser.value = null
    loaded.value = true
  }

  return {
    currentUser,
    isAuthenticated: computed(() => currentUser.value !== null),
    isLoadingAuth: pending,
    fetchCurrentUser,
    login,
    logout
  }
}
