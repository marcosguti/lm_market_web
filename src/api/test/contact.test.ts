import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../client';
import { sendContactMessage } from '../contact';

vi.mock('../client', () => ({ api: vi.fn() }));

describe('contact api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sendContactMessage posts to /api/contact with skipAuth', async () => {
    vi.mocked(client.api).mockResolvedValue({
      data: { message: 'ok' },
      ok: true,
      status: 200,
    });

    const body = {
      area: 'soporte' as const,
      email: 'cliente@test.com',
      message: 'Necesito ayuda con mi pedido, por favor.',
      name: 'Marco',
      subject: 'Ayuda con pedido',
    };

    await sendContactMessage(body);

    expect(client.api).toHaveBeenCalledWith('/api/contact', {
      body: JSON.stringify(body),
      method: 'POST',
      skipAuth: true,
    });
  });
});
