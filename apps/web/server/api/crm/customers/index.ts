import { proxyCrmRequest } from '../../../utils/crmProxy'

export default defineEventHandler((event) => proxyCrmRequest(event, '/api/customers'))
