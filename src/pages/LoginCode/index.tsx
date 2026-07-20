import { Alert, Button, Form, Input, Typography } from 'antd';
import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { OtpInput } from '../../components/OtpInput';
import SEO from '../../components/SEO';
import { OTP_DIGIT_COUNT } from '../../constants/formTheme';
import { PATHS } from '../../constants/paths';
import { useAuth } from '../../context/AuthContext';
import { useAutoDismissError } from '../../hooks/useAutoDismissError';
import { useVerificationCountdown } from '../../hooks/useVerificationCountdown';

const { Title, Paragraph, Text } = Typography;

const RESEND_AFTER_VERIFY_ERROR_CODES = new Set(['CODE_EXPIRED', 'TOO_MANY_ATTEMPTS']);

const LoginCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? PATHS.home;
  const { sendLoginCode, verifyLoginCode } = useAuth();

  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [expiresInSeconds, setExpiresInSeconds] = useState(0);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const { formatted, resetCountdown, secondsRemaining } =
    useVerificationCountdown(expiresInSeconds);

  const setStatus = (next: { error?: string; info?: string }) => {
    setError(next.error ?? '');
    setInfo(next.info ?? '');
  };

  const clearError = useCallback(() => {
    setError('');
  }, []);

  useAutoDismissError(error, clearError);

  const handleSend = async (targetEmail?: string) => {
    const normalizedEmail = (targetEmail ?? email).trim();
    if (!normalizedEmail) {
      setStatus({ error: 'Ingresa tu correo' });
      return;
    }

    if (secondsRemaining > 0) {
      return;
    }

    setStatus({});
    setSending(true);

    const result = await sendLoginCode(normalizedEmail);

    setSending(false);

    if (result.code === 'EMAIL_NOT_REGISTERED') {
      setStatus({ error: 'Este correo no está registrado' });
      return;
    }

    if (result.code === 'EMAIL_NOT_VERIFIED') {
      setStatus({ error: 'Debes verificar tu correo antes de iniciar sesión' });
      return;
    }

    if (result.code === 'CODE_STILL_VALID' && result.codeExpiresInSeconds) {
      setEmail(normalizedEmail);
      setExpiresInSeconds(result.codeExpiresInSeconds);
      resetCountdown(result.codeExpiresInSeconds);
      setCodeSent(true);
      setStatus({ error: result.error ?? 'Ya tienes un código vigente.' });
      return;
    }

    if (result.error) {
      setStatus({ error: result.error });
      return;
    }

    const ttl = result.codeExpiresInSeconds ?? 0;
    setEmail(normalizedEmail);
    setExpiresInSeconds(ttl);
    resetCountdown(ttl);
    setCodeSent(true);
    setStatus({ info: 'Código enviado. Revisa tu correo.' });
  };

  const handlePinChange = async (value: string) => {
    setPin(value);
    setStatus({});

    if (value.length !== OTP_DIGIT_COUNT) return;

    setVerifying(true);

    const result = await verifyLoginCode(email, value);

    setVerifying(false);

    if (result.error) {
      if (result.code && RESEND_AFTER_VERIFY_ERROR_CODES.has(result.code)) {
        setExpiresInSeconds(0);
        resetCountdown(0);
      }

      setStatus({ error: result.error });
      setPin('');
      return;
    }

    navigate(from, { replace: true });
  };

  return (
    <>
      <SEO title="Iniciar sesión con código" description="Accede con un código de 4 dígitos." />

      <div className="mx-auto max-w-md px-4 py-12">
        <Title className="!mb-2 text-center" level={2}>
          Iniciar sesión con código
        </Title>

        <Paragraph className="text-center text-gray-600">
          {codeSent ? (
            <>
              Ingresa el código de 4 dígitos enviado a <Text strong>{email}</Text>
            </>
          ) : (
            'Te enviaremos un código de 4 dígitos a tu correo registrado.'
          )}
        </Paragraph>

        {secondsRemaining > 0 ? (
          <Paragraph className="text-center text-gray-600">
            El código expira en <Text strong>{formatted}</Text>
          </Paragraph>
        ) : null}

        {error ? <Alert className="mb-4" message={error} showIcon type="error" /> : null}
        {info ? <Alert className="mb-4" message={info} showIcon type="success" /> : null}

        {!codeSent ? (
          <Form
            className="flex flex-col gap-4"
            layout="vertical"
            onFinish={(values: { email: string }) => void handleSend(values.email)}
            requiredMark={false}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'El email es obligatorio' },
                { type: 'email', message: 'Ingresa un email válido' },
              ]}
            >
              <Input
                className="h-10"
                placeholder="tu@email.com"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setStatus({});
                }}
              />
            </Form.Item>
            <Button className="h-10" htmlType="submit" loading={sending} type="primary">
              Enviar código
            </Button>
          </Form>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <OtpInput
              disabled={verifying}
              value={pin}
              onChange={(value) => void handlePinChange(value)}
            />

            <Button
              disabled={secondsRemaining > 0}
              loading={sending}
              type="link"
              onClick={() => void handleSend()}
            >
              {secondsRemaining > 0 ? `Reenviar código (${formatted})` : 'Reenviar código'}
            </Button>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-600">
          <Link className="text-primary hover:underline" to={PATHS.login}>
            Volver a iniciar sesión con contraseña
          </Link>
        </p>
      </div>
    </>
  );
};

export default LoginCode;
