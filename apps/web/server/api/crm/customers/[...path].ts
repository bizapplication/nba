import { getRouterParam } from 'h3'

import { proxyCrmRequest } from '../../../utils/crmProxy'

export default defineEventHandler((event) => {
  const path = getRouterParam(event, 'path')
  return proxyCrmRequest(event, `/api/customers/${path ?? ''}`)
})
