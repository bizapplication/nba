import { Router } from 'express';

import type { AppContainer } from '../../../shared/container.ts';

export function createHealthRouter(container: AppContainer): Router {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.json({
      service: '@nba/erp',
      status: 'ok',
      dataMode: container.config.dataMode,
    });
  });

  return router;
}
