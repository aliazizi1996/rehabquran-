import React from 'react';
import { RegistrationPortalView, RegistrationPortalMode } from './RegistrationPortalView';
import { DbStudent } from '../data/academyDb';
import { AuthAccount } from '../types';

interface StudentRegistrationViewProps {
  onSuccess: (account: AuthAccount, student: DbStudent) => void;
  onBackToHome: () => void;
  onSwitchToLogin: () => void;
  initialMode?: RegistrationPortalMode;
}

export const StudentRegistrationView: React.FC<StudentRegistrationViewProps> = ({
  onSuccess,
  onBackToHome,
  onSwitchToLogin,
  initialMode = 'selection',
}) => {
  return (
    <RegistrationPortalView
      initialMode={initialMode}
      onSuccessStudent={onSuccess}
      onBackToHome={onBackToHome}
      onSwitchToLogin={() => onSwitchToLogin()}
    />
  );
};
