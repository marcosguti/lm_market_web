import { vi } from 'vitest';

import { buildAntdTestMock } from './antdMocks';

vi.mock('antd', async (importOriginal) =>
  buildAntdTestMock(() => importOriginal<typeof import('antd')>()),
);
