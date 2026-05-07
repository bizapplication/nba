export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/home')) {
    return
  }

  const auth = useDemoAuth()
  await auth.fetchCurrentUser()

  if (!auth.isAuthenticated.value) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
