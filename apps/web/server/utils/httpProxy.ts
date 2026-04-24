import { getRequestURL, proxyRequest, type H3Event } from 'h3'

export function proxyHttpRequest(event: H3Event, baseUrl: string, pathname: string) {
  const target = new URL(pathname, baseUrl)
  target.search = getRequestURL(event).search

  return proxyRequest(event, target.toString(), {
    streamRequest: true,
    sendStream: true
  })
}
