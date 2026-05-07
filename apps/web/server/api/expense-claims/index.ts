import {
  createError,
  getMethod,
  getQuery,
  getRequestHeaders,
  readBody,
  setResponseStatus
} from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const target = new URL('/api/expense-claims', config.financeApiBase)
  const query = getQuery(event)

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        target.searchParams.append(key, String(item))
      }
      continue
    }

    if (value !== undefined && value !== null && value !== '') {
      target.searchParams.set(key, String(value))
    }
  }

  const method = getMethod(event)
  const headers = getRequestHeaders(event)
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(event) : undefined

  try {
    const response = await $fetch.raw(target.toString(), {
      method,
      body,
      headers: headers['content-type']
        ? {
            'content-type': headers['content-type']
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
        _data?: { message?: string }
      }
    }

    throw createError({
      statusCode: fetchError.response?.status || 500,
      statusMessage: fetchError.response?._data?.message || fetchError.response?.statusText || 'Expense claim proxy request failed',
      data: fetchError.response?._data || null
    })
  }
})
