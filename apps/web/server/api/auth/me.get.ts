import { createError, getRequestHeaders, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const headers = getRequestHeaders(event)

  try {
    const response = await $fetch.raw(new URL('/api/auth/me', config.platformApiBase).toString(), {
      method: 'GET',
      headers: headers.cookie
        ? {
            cookie: headers.cookie
          }
        : undefined
    })

    setResponseStatus(event, response.status, response.statusText)
    return response._data
  } catch (error) {
    const fetchError = error as {
      response?: {
        status?: number
        statusText?: string
        _data?: {
          message?: string
        }
      }
    }

    throw createError({
      statusCode: fetchError.response?.status || 500,
      statusMessage: fetchError.response?._data?.message || fetchError.response?.statusText || 'Auth me proxy request failed',
      data: fetchError.response?._data || null
    })
  }
})
