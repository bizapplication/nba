import { createError, getRequestHeaders, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const headers = getRequestHeaders(event)

  try {
    const response = await $fetch.raw(new URL('/api/auth/logout', config.platformApiBase).toString(), {
      method: 'POST',
      headers: headers.cookie
        ? {
            cookie: headers.cookie
          }
        : undefined
    })

    setResponseStatus(event, response.status, response.statusText)

    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      event.node.res.setHeader('set-cookie', setCookie)
    }

    return response._data
  } catch (error) {
    const fetchError = error as {
      response?: {
        status?: number
        statusText?: string
        headers?: Headers
        _data?: {
          message?: string
        }
      }
    }

    const setCookie = fetchError.response?.headers?.get('set-cookie')
    if (setCookie) {
      event.node.res.setHeader('set-cookie', setCookie)
    }

    throw createError({
      statusCode: fetchError.response?.status || 500,
      statusMessage: fetchError.response?._data?.message || fetchError.response?.statusText || 'Auth logout proxy request failed',
      data: fetchError.response?._data || null
    })
  }
})
