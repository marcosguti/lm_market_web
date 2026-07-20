import type { ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSendContactMessage = vi.fn();

vi.mock('../../../api/contact', async () => {
  const actual =
    await vi.importActual<typeof import('../../../api/contact')>('../../../api/contact');
  return {
    ...actual,
    sendContactMessage: (...args: unknown[]) => mockSendContactMessage(...args),
  };
});

vi.mock('../../../components/SEO', () => ({
  default: () => null,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children?: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    h1: ({ children, className }: { children?: ReactNode; className?: string }) => (
      <h1 className={className}>{children}</h1>
    ),
    p: ({ children, className }: { children?: ReactNode; className?: string }) => (
      <p className={className}>{children}</p>
    ),
  },
}));

import Contact from '../index';

describe('Contact page smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading, intro and contact info', () => {
    render(<Contact />);

    expect(screen.getByRole('heading', { name: 'Contacto' })).toBeInTheDocument();
    expect(screen.getByText('Escríbenos y te respondemos a la brevedad.')).toBeInTheDocument();
    expect(screen.getByText('Soporte@lmmarketca.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('does not call API when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<Contact />);

    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Selecciona un área')).toBeInTheDocument();
    expect(mockSendContactMessage).not.toHaveBeenCalled();
  });

  it('submits valid form and shows success', async () => {
    mockSendContactMessage.mockResolvedValue({
      data: { message: 'Tu mensaje fue enviado. Te responderemos a la brevedad.' },
      ok: true,
      status: 200,
    });
    const user = userEvent.setup();
    render(<Contact />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Soporte'));
    await user.type(screen.getByLabelText('Nombre *'), 'Marco');
    await user.type(screen.getByLabelText('Correo electrónico *'), 'marco@test.com');
    await user.type(screen.getByLabelText('Asunto *'), 'Ayuda pedido');
    await user.type(
      screen.getByLabelText('Mensaje *'),
      'Necesito ayuda con el seguimiento de mi pedido.'
    );
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(mockSendContactMessage).toHaveBeenCalledWith({
        area: 'soporte',
        email: 'marco@test.com',
        message: 'Necesito ayuda con el seguimiento de mi pedido.',
        name: 'Marco',
        subject: 'Ayuda pedido',
      });
    });

    expect(await screen.findByText('Mensaje enviado')).toBeInTheDocument();
  });
});
