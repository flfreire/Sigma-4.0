import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EquipmentList from './components/EquipmentList';
import ServiceOrderList from './components/ServiceOrderList';
import PredictiveAssistant from './components/PredictiveAssistant';
import AuthPage from './components/auth/AuthPage';
import { useDbData } from './hooks/useDbData';
import { I18nProvider, useTranslation } from './i18n/config';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PreventiveMaintenance from './components/PreventiveMaintenance';
import UserManagement from './components/UserManagement';
import Chat from './components/Chat';
import UserList from './components/UserList';
import PartnerList from './components/PartnerList';
import { UserRole, View, Notification } from './types';
import ChecklistTemplates from './components/ChecklistTemplates';
import QRScannerModal from './components/QRScannerModal';
import Analysis from './components/Analysis';
import MetrologyList from './components/MetrologyList';
import { useNotifications } from './hooks/useNotifications';

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const data = useDbData(user?.id);
  const { t } = useTranslation();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [equipmentToFocus, setEquipmentToFocus] = useState<string | null>(null);
  const [instrumentToFocus, setInstrumentToFocus] = useState<string | null>(null);

  const notificationData = useNotifications({
    equipment: data.equipment,
    serviceOrders: data.serviceOrders,
    instruments: data.measurementInstruments,
  });

  useEffect(() => {
    // On application startup, request the user's location permission to enhance map features.
    // This triggers the browser's native permission prompt if the user hasn't
    // already granted or denied it for this site.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Success: permission granted or already available.
          // The map component will use it when required.
          console.log("Geolocation permission has been granted.");
        },
        (error) => {
          // Error: user denied permission or another error occurred.
          // The app will continue to function, but location-based features will be limited.
          console.warn(`Geolocation permission error: ${error.message}`);
        }
      );
    }
  }, []); // Empty dependency array ensures this runs only once when the app loads.


  const userTeam = useMemo(() => {
    if (!user?.teamId || !data.teams) return null;
    return data.teams.find(t => t.id === user.teamId) || null;
  }, [user, data.teams]);
  
  const handleNavigate = (view: View) => {
    setCurrentView(view);
    if(isMobileMenuOpen){
      setIsMobileMenuOpen(false);
    }
  };
  
  const handleScanSuccess = (decodedText: string) => {
      setIsScannerOpen(false);
      try {
          const parsed = JSON.parse(decodedText);
          if (parsed && parsed.id) {
              const foundEquipment = data.equipment.find(e => e.id === parsed.id);
              if (foundEquipment) {
                  setCurrentView('equipment');
                  setEquipmentToFocus(foundEquipment.id);
              } else {
                  alert(t('scanner.error.notFound'));
              }
          } else {
              alert(t('scanner.error.invalid'));
          }
      } catch (error) {
          alert(t('scanner.error.invalid'));
      }
  };

  const handleNotificationClick = (notification: Notification) => {
    notificationData.markAsRead(notification.id);
    if (notification.link) {
      setCurrentView(notification.link.view);
      if (notification.link.view === 'equipment') {
        setEquipmentToFocus(notification.link.focusId);
      }
      if (notification.link.view === 'metrology') {
        setInstrumentToFocus(notification.link.focusId);
      }
    }
  };

  const viewTitles: { [key in View]?: string } = {
    dashboard: t('viewTitles.dashboard'),
    equipment: t('viewTitles.equipment'),
    metrology: t('viewTitles.metrology'),
    'service-orders': t('viewTitles.service-orders'),
    assistant: t('viewTitles.assistant'),
    'preventive-maintenance': t('viewTitles.preventive-maintenance'),
    partners: t('viewTitles.partners'),
    'user-management': user?.role === UserRole.Admin ? t('viewTitles.user-management') : t('viewTitles.team'),
    chat: t('viewTitles.chat'),
    users: t('viewTitles.users'),
    analysis: t('viewTitles.analysis'),
  };

  const renderView = () => {
    if(data.isLoading || !user) {
      return (
        <div className="flex-1 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      );
    }
    // Check permissions before rendering
    if (!user.permissions.includes(currentView)) {
        // Fallback to dashboard if permission is lost for current view
        if (currentView !== 'dashboard') {
            setCurrentView('dashboard');
        }
        return <Dashboard 
                  equipment={data.equipment} 
                  serviceOrders={data.serviceOrders}
                  users={data.users}
                  partners={data.partners}
                  checklistTemplates={data.checklistTemplates}
                />;
    }

    switch (currentView) {
      case 'equipment':
        return <EquipmentList 
                    equipment={data.equipment} 
                    addEquipment={data.addEquipment} 
                    updateEquipment={data.updateEquipment}
                    deleteEquipment={data.deleteEquipment}
                    replacementParts={data.replacementParts}
                    addReplacementPart={data.addReplacementPart}
                    updateReplacementPart={data.updateReplacementPart}
                    deleteReplacementPart={data.deleteReplacementPart}
                    checklistTemplates={data.checklistTemplates}
                    equipmentToFocus={equipmentToFocus}
                    onFocusDone={() => setEquipmentToFocus(null)}
                    templates={data.checklistTemplates}
                    addTemplate={data.addChecklistTemplate}
                    updateTemplate={data.updateChecklistTemplate}
                    deleteTemplate={data.deleteChecklistTemplate}
                />;
      case 'metrology':
        return <MetrologyList
                  instruments={data.measurementInstruments}
                  addInstrument={data.addMeasurementInstrument}
                  updateInstrument={data.updateMeasurementInstrument}
                  deleteInstrument={data.deleteMeasurementInstrument}
                  instrumentToFocus={instrumentToFocus}
                  onFocusDone={() => setInstrumentToFocus(null)}
                  checklistTemplates={data.checklistTemplates}
                  templates={data.checklistTemplates}
                  addTemplate={data.addChecklistTemplate}
                  updateTemplate={data.updateChecklistTemplate}
                  deleteTemplate={data.deleteChecklistTemplate}
                />;
      case 'service-orders':
        return <ServiceOrderList 
                  serviceOrders={data.serviceOrders} 
                  equipment={data.equipment} 
                  addServiceOrder={data.addServiceOrder} 
                  updateServiceOrder={data.updateServiceOrder}
                  checklistTemplates={data.checklistTemplates}
                  checklistExecutions={data.checklistExecutions}
                  addChecklistExecution={data.addChecklistExecution}
                  getChecklistExecutionById={data.getChecklistExecutionById}
                  users={data.users}
                  teams={data.teams}
                  failureModes={data.failureModes}
                  addFailureMode={data.addFailureMode}
                  updateFailureMode={data.updateFailureMode}
                  deleteFailureMode={data.deleteFailureMode}
                />;
      case 'assistant':
        return <div className="p-6"><PredictiveAssistant equipmentList={data.equipment} /></div>;
      case 'preventive-maintenance':
        return <PreventiveMaintenance serviceOrders={data.serviceOrders} equipment={data.equipment} />;
      case 'analysis':
        return <Analysis 
                  serviceOrders={data.serviceOrders}
                  equipment={data.equipment}
                  failureModes={data.failureModes}
               />;
      case 'partners':
        return <PartnerList 
                  partners={data.partners}
                  addPartner={data.addPartner}
                  updatePartner={data.updatePartner}
                  deletePartner={data.deletePartner}
                  serviceCategories={data.serviceCategories}
                  addServiceCategory={data.addServiceCategory}
                  updateServiceCategory={data.updateServiceCategory}
                  deleteServiceCategory={data.deleteServiceCategory}
                  quotes={data.quotes}
                  currentUser={user}
                  addQuote={data.addQuote}
                  updateQuote={data.updateQuote}
                  deleteQuote={data.deleteQuote}
                />;
      case 'users':
        return <UserList 
                  users={data.users} 
                  teams={data.teams} 
                  currentUser={user}
                  addUser={data.addUser}
                  updateUser={data.updateUser}
                  deleteUser={data.deleteUser}
               />;
      case 'user-management':
        return <UserManagement
                  currentUser={user}
                  users={data.users}
                  teams={data.teams}
                  team={userTeam}
                  assignUserToTeam={data.assignUserToTeam}
                  createTeam={data.createTeam}
                  addTeamMember={data.addTeamMember}
                  removeTeamMember={data.removeTeamMember}
                  addUser={data.addUser}
                  updateUser={data.updateUser}
                  deleteUser={data.deleteUser}
                />;
      case 'chat':
        return <Chat 
                  messages={data.chatMessages} 
                  onSendMessage={data.addChatMessage} 
                  currentUser={user}
                  team={userTeam} 
               />;
      case 'dashboard':
      default:
        return <Dashboard 
                  equipment={data.equipment} 
                  serviceOrders={data.serviceOrders}
                  users={data.users}
                  partners={data.partners}
                  checklistTemplates={data.checklistTemplates}
                />;
    }
  };

  return (
    <div className="h-screen flex bg-primary text-light font-sans overflow-hidden">
       <QRScannerModal 
            isOpen={isScannerOpen} 
            onClose={() => setIsScannerOpen(false)} 
            onScanSuccess={handleScanSuccess} 
        />
        {/* Mobile sidebar overlay */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 flex z-40 lg:hidden" role="dialog" aria-modal="true">
                <div className="fixed inset-0 bg-black bg-opacity-60" aria-hidden="true" onClick={() => setIsMobileMenuOpen(false)}></div>
                <div className="relative flex-1 flex flex-col max-w-xs w-full">
                    <Sidebar 
                      currentView={currentView} 
                      onNavigate={handleNavigate} 
                      onClose={() => setIsMobileMenuOpen(false)}
                      currentUser={user}
                      team={userTeam}
                      onScanClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsScannerOpen(true);
                      }}
                    />
                </div>
            </div>
        )}

        {/* Static sidebar for desktop */}
        <div className="hidden lg:flex lg:flex-shrink-0">
            <Sidebar 
              currentView={currentView} 
              onNavigate={handleNavigate} 
              onClose={() => {}}
              currentUser={user}
              team={userTeam}
              onScanClick={() => setIsScannerOpen(true)}
            />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
            <Header
                title={viewTitles[currentView] || 'SIGMA 4.0'}
                onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
                notifications={notificationData.notifications}
                unreadCount={notificationData.unreadCount}
                onNotificationClick={handleNotificationClick}
                onMarkAllAsRead={notificationData.markAllAsRead}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                {renderView()}
            </main>
        </div>
    </div>
  );
};

const AppContent: React.FC = () => {
    const { user } = useAuth();
    return user ? <MainApp /> : <AuthPage />;
}

const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;