import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Login from '../index';



const loginMock = vi.fn();

const navigateMock = vi.fn();

const sendVerificationCodeMock = vi.fn();



vi.mock('../../../components/SEO', () => ({
  default: () => null,
}));

vi.mock('../../../components/VerifyEmailLoginModal', () => ({
  default: ({
    email,
    initialExpiresInSeconds,
    onContinue,
    open,
  }: {
    email: string;
    initialExpiresInSeconds: number;
    onContinue: (state: {
      codeExpiresInSeconds: number;
      codeSent: boolean;
      email: string;
      verificationContext: 'login';
    }) => void;
    open: boolean;
  }) =>
    open ? (
      <div role="dialog">
        <p>Verifica tu correo</p>
        <p>Ya hay un código vigente. Revisa tu bandeja de entrada.</p>
        <button
          type="button"
          onClick={() =>
            onContinue({
              codeExpiresInSeconds: initialExpiresInSeconds,
              codeSent: initialExpiresInSeconds > 0,
              email,
              verificationContext: 'login',
            })
          }
        >
          Ingresar código
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../context/AuthContext', () => ({

  useAuth: () => ({

    login: loginMock,

    sendVerificationCode: sendVerificationCodeMock,

  }),

}));



vi.mock('react-router-dom', async () => {

  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {

    ...actual,

    useNavigate: () => navigateMock,

  };

});



describe('Login RBAC redirect', () => {

  beforeEach(() => {

    loginMock.mockReset();

    navigateMock.mockReset();

    sendVerificationCodeMock.mockReset();

  });



  it('navigates to original route after successful login', async () => {

    loginMock.mockResolvedValue({});

    render(

      <MemoryRouter

        initialEntries={[

          { pathname: '/iniciar-sesion', state: { from: { pathname: '/checkout' } } },

        ]}

      >

        <Routes>

          <Route path="/iniciar-sesion" element={<Login />} />

        </Routes>

      </MemoryRouter>

    );



    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {

      target: { value: 'client@test.com' },

    });

    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), {

      target: { value: 'secret' },

    });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));



    await waitFor(() => {

      expect(navigateMock).toHaveBeenCalledWith('/checkout', { replace: true });

    });

  });



  it('opens verify email modal when account is not verified', async () => {

    loginMock.mockResolvedValue({

      code: 'EMAIL_NOT_VERIFIED',

      codeExpiresInSeconds: 900,

      email: 'client@test.com',

    });

    render(

      <MemoryRouter initialEntries={['/iniciar-sesion']}>

        <Routes>

          <Route path="/iniciar-sesion" element={<Login />} />

        </Routes>

      </MemoryRouter>

    );



    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {

      target: { value: 'client@test.com' },

    });

    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), {

      target: { value: 'secret' },

    });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));



    await waitFor(() => {

      expect(screen.getByText('Verifica tu correo')).toBeInTheDocument();

      expect(screen.getByText(/ya hay un código vigente/i)).toBeInTheDocument();

    });

    expect(navigateMock).not.toHaveBeenCalled();

  });



  it('navigates to verify email after continuing from modal', async () => {

    loginMock.mockResolvedValue({

      code: 'EMAIL_NOT_VERIFIED',

      codeExpiresInSeconds: 900,

      email: 'client@test.com',

    });

    render(

      <MemoryRouter initialEntries={['/iniciar-sesion']}>

        <Routes>

          <Route path="/iniciar-sesion" element={<Login />} />

        </Routes>

      </MemoryRouter>

    );



    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {

      target: { value: 'client@test.com' },

    });

    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), {

      target: { value: 'secret' },

    });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));



    await waitFor(() => {

      expect(screen.getByRole('button', { name: 'Ingresar código' })).toBeInTheDocument();

    });

    fireEvent.click(screen.getByRole('button', { name: 'Ingresar código' }));



    await waitFor(() => {

      expect(navigateMock).toHaveBeenCalledWith('/verificar-email', {

        replace: true,

        state: {

          codeExpiresInSeconds: 900,

          codeSent: true,

          email: 'client@test.com',

          verificationContext: 'login',

        },

      });

    });

  });

});
