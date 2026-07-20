import { Alert, Button, Typography } from 'antd';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { EmailVerificationLocationState } from '../../types/emailVerification';

import { OtpInput } from '../../components/OtpInput';
import SEO from '../../components/SEO';
import { OTP_DIGIT_COUNT } from '../../constants/formTheme';
import { PATHS } from '../../constants/paths';
import { useAuth } from '../../context/AuthContext';
import { useAutoDismissError } from '../../hooks/useAutoDismissError';
import { useVerificationCountdown } from '../../hooks/useVerificationCountdown';

const { Title, Paragraph, Text } = Typography;

const RESEND_AFTER_VERIFY_ERROR_CODES = new Set(['CODE_EXPIRED', 'TOO_MANY_ATTEMPTS']);

const VerifyEmail = () => {
  const navigate = useNavigate();

  const location = useLocation();

  const { sendVerificationCode, verifyEmail } = useAuth();

  const verificationState = location.state as EmailVerificationLocationState;

  const { email, codeSent: initialCodeSent = false, codeExpiresInSeconds = 0 } = verificationState;

  const [codeSent, setCodeSent] = useState(initialCodeSent || codeExpiresInSeconds > 0);

  const [expiresInSeconds, setExpiresInSeconds] = useState(codeExpiresInSeconds);

  const [pin, setPin] = useState('');

  const [error, setError] = useState('');

  const [info, setInfo] = useState(() =>
    initialCodeSent && codeExpiresInSeconds > 0 ? 'Código enviado. Revisa tu correo.' : ''
  );

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

  const handleSend = async () => {
    if (secondsRemaining > 0) {
      return;
    }

    setStatus({});

    setSending(true);

    const result = await sendVerificationCode(email);

    setSending(false);

    if (result.code === 'CODE_STILL_VALID' && result.codeExpiresInSeconds) {
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

    const result = await verifyEmail(email, value);

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

    navigate(PATHS.home, { replace: true });
  };

  return (
    <>
      <SEO title="Verifica tu correo" description="Verifica tu correo en LM Market." />

      <div className="mx-auto max-w-md px-4 py-12">
        <Title className="!mb-2 text-center" level={2}>
          Verifica tu correo
        </Title>

        <Paragraph className="text-center text-gray-600">
          {codeSent ? (
            <>
              Ingresa el código de 4 dígitos enviado a <Text strong>{email}</Text>
            </>
          ) : (
            <>
              Enviaremos un código de 4 dígitos a <Text strong>{email}</Text>
            </>
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
          <Button
            block
            className="h-10"
            loading={sending}
            type="primary"
            onClick={() => void handleSend()}
          >
            Enviar código al correo
          </Button>
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
      </div>
    </>
  );
};

export default VerifyEmail;
