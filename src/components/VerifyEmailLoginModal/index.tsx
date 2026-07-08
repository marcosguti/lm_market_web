import { Alert, Button, Modal, Typography } from 'antd';
import { useCallback, useState } from 'react';

import type { EmailVerificationLocationState } from '../../types/emailVerification';

import { useAuth } from '../../context/AuthContext';
import { useAutoDismissError } from '../../hooks/useAutoDismissError';
import { useVerificationCountdown } from '../../hooks/useVerificationCountdown';

const { Paragraph, Text } = Typography;

interface VerifyEmailLoginModalProps {
  email: string;
  initialExpiresInSeconds: number;
  onClose: () => void;
  onContinue: (state: EmailVerificationLocationState) => void;
  open: boolean;
}

function VerifyEmailLoginModal({
  email,
  initialExpiresInSeconds,
  onClose,
  onContinue,
  open,
}: VerifyEmailLoginModalProps) {
  const { sendVerificationCode } = useAuth();
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [sending, setSending] = useState(false);
  const [expiresInSeconds, setExpiresInSeconds] = useState(initialExpiresInSeconds);
  const { formatted, resetCountdown, secondsRemaining } =
    useVerificationCountdown(expiresInSeconds);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  useAutoDismissError(error, clearError);

  const handleResend = async () => {
    if (secondsRemaining > 0) {
      return;
    }
    setError('');
    setInfo('');
    setSending(true);
    const result = await sendVerificationCode(email);
    setSending(false);

    if (result.code === 'CODE_STILL_VALID' && result.codeExpiresInSeconds) {
      setExpiresInSeconds(result.codeExpiresInSeconds);
      resetCountdown(result.codeExpiresInSeconds);
      setError(result.error ?? 'Ya tienes un código vigente.');
      return;
    }

    if (result.error) {
      setError(result.error);
      return;
    }

    const ttl = result.codeExpiresInSeconds ?? 0;
    setExpiresInSeconds(ttl);
    resetCountdown(ttl);
    setInfo('Código enviado. Revisa tu correo.');
  };

  const handleContinue = () => {
    onContinue({
      codeExpiresInSeconds: secondsRemaining > 0 ? secondsRemaining : expiresInSeconds,
      codeSent: secondsRemaining > 0 || expiresInSeconds > 0 || Boolean(info),
      email,
      verificationContext: 'login',
    });
  };

  return (
    <Modal
      footer={null}
      onCancel={onClose}
      open={open}
      title="Verifica tu correo"
      afterOpenChange={(visible) => {
        if (visible) {
          setExpiresInSeconds(initialExpiresInSeconds);
          resetCountdown(initialExpiresInSeconds);
          setError('');
          setInfo('');
        }
      }}
    >
      <Paragraph>
        Tu cuenta existe pero aún no has verificado el correo <Text strong>{email}</Text>.
        {secondsRemaining > 0
          ? ' Ya hay un código vigente. Revisa tu bandeja de entrada.'
          : ' Puedes solicitar un nuevo código para continuar.'}
      </Paragraph>

      {secondsRemaining > 0 ? (
        <Paragraph className="!mb-4 text-gray-600">
          El código expira en <Text strong>{formatted}</Text>
        </Paragraph>
      ) : null}

      {error ? <Alert className="mb-4" message={error} showIcon type="error" /> : null}
      {info ? <Alert className="mb-4" message={info} showIcon type="success" /> : null}

      <div className="flex flex-col gap-3">
        <Button
          block
          disabled={secondsRemaining > 0}
          loading={sending}
          onClick={() => void handleResend()}
        >
          {secondsRemaining > 0 ? `Reenviar código (${formatted})` : 'Reenviar código'}
        </Button>
        <Button block type="primary" onClick={handleContinue}>
          Ingresar código
        </Button>
      </div>
    </Modal>
  );
}

export default VerifyEmailLoginModal;
