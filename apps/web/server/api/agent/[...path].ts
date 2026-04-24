import { getRouterParam } from 'h3'

import { proxyHttpRequest } from '~/server/utils/httpProxy'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const path = getRouterParam(event, 'path')
  const suffix = path ? `/${path}` : ''
  return proxyHttpRequest(event, config.agentApiBase, `/api${suffix}`)
})
