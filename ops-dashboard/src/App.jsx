import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { PasscodeGuard } from './components/common/PasscodeGuard';
import { AppLayout } from './components/layout/AppLayout';

import { DashboardHome } from './components/dashboard/DashboardHome';
import { LeadsModule } from './components/leads/LeadsModule';
import { PatientsModule } from './components/patients/PatientsModule';
import { SessionsModule } from './components/sessions/SessionsModule';
import { PrescriptionBuilder } from './components/prescriptions/PrescriptionBuilder';
import { PlansModule } from './components/plans/PlansModule';
import { NotificationsModule } from './components/notifications/NotificationsModule';

export const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome onNavigate={(tab) => setActiveTab(tab)} />;
      case 'leads':
        return <LeadsModule onNavigate={(tab) => setActiveTab(tab)} />;
      case 'patients':
        return <PatientsModule />;
      case 'sessions':
        return <SessionsModule />;
      case 'prescriptions':
        return <PrescriptionBuilder />;
      case 'plans':
        return <PlansModule />;
      case 'notifications':
        return <NotificationsModule />;
      default:
        return <DashboardHome onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <AuthProvider>
      <NotificationProvider>
        <PasscodeGuard>
          <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderTabContent()}
          </AppLayout>
        </PasscodeGuard>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
