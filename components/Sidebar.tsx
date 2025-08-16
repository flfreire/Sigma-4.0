
import React from 'react';
import { DashboardIcon, WrenchScrewdriverIcon, ClipboardListIcon, SparklesIcon, XMarkIcon, CalendarDaysIcon, UsersIcon, ChatBubbleLeftRightIcon, UserGroupIcon, TruckIcon, ClipboardDocumentCheckIcon, QrCodeIcon } from './icons';
import { useTranslation } from '../i18n/config';
import { Team, User, View } from '../types';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onClose: () => void;
  currentUser: User | null;
  team: Team | null;
  onScanClick: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-md cursor-pointer transition-colors duration-200 ${
      isActive ? 'bg-brand text-white' : 'text-highlight hover:bg-accent hover:text-light'
    }`}
  >
    {icon}
    <span className="ml-3 font-medium">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onClose, currentUser, team, onScanClick }) => {
  const { t } = useTranslation();
  
  if (!currentUser) return null;

  const isTeamOwner = team?.ownerId === currentUser.id;
  const isAdmin = currentUser.role === 'Admin';
  const permissions = currentUser.permissions || [];

  const navItems: { view: View, label: string, icon: React.ReactNode, requiredPermission: View }[] = [
      { view: 'dashboard', label: t('sidebar.dashboard'), icon: <DashboardIcon className="h-6 w-6" />, requiredPermission: 'dashboard' },
      { view: 'equipment', label: t('sidebar.equipment'), icon: <WrenchScrewdriverIcon className="h-6 w-6" />, requiredPermission: 'equipment' },
      { view: 'service-orders', label: t('sidebar.serviceOrders'), icon: <ClipboardListIcon className="h-6 w-6" />, requiredPermission: 'service-orders' },
      { view: 'preventive-maintenance', label: t('sidebar.preventiveMaintenance'), icon: <CalendarDaysIcon className="h-6 w-6" />, requiredPermission: 'preventive-maintenance' },
      { view: 'checklists', label: t('sidebar.checklists'), icon: <ClipboardDocumentCheckIcon className="h-6 w-6" />, requiredPermission: 'checklists'},
      { view: 'suppliers', label: t('sidebar.suppliers'), icon: <TruckIcon className="h-6 w-6" />, requiredPermission: 'suppliers' },
      { view: 'users', label: t('sidebar.users'), icon: <UsersIcon className="h-6 w-6" />, requiredPermission: 'users' },
  ];

  return (
    <aside className="w-64 bg-secondary p-4 flex flex-col h-full border-r border-accent">
      <div className="flex items-center mb-8 flex-shrink-0">
        <WrenchScrewdriverIcon className="h-10 w-10 text-brand" />
        <h1 className="text-xl font-bold ml-2 text-light">{t('sidebar.title')}</h1>
        <button onClick={onClose} className="ml-auto lg:hidden text-highlight hover:text-light">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-grow">
        <ul>
            {navItems.map(item => permissions.includes(item.requiredPermission) && (
                <NavItem
                    key={item.view}
                    icon={item.icon}
                    label={item.label}
                    isActive={currentView === item.view}
                    onClick={() => onNavigate(item.view)}
                />
            ))}
            
            {team && permissions.includes('chat') && (
                <NavItem
                    icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
                    label={t('sidebar.chat')}
                    isActive={currentView === 'chat'}
                    onClick={() => onNavigate('chat')}
                />
            )}

            {(isAdmin || isTeamOwner || !team) && permissions.includes('user-management') && (
                <NavItem
                    icon={<UserGroupIcon className="h-6 w-6" />}
                    label={isAdmin ? t('sidebar.userManagement') : t('sidebar.teamManagement')}
                    isActive={currentView === 'user-management'}
                    onClick={() => onNavigate('user-management')}
                />
            )}
        </ul>
      </nav>
      <div className="mt-auto flex-shrink-0 space-y-4">
        {team && !isTeamOwner && (
            <div className="text-center text-xs text-highlight bg-primary p-2 rounded-md">
                {t('team.affiliatedWith', { teamName: team.name })}
            </div>
        )}
        <div
            onClick={onScanClick}
            className={`flex items-center p-3 rounded-md cursor-pointer transition-colors duration-200 text-cyan-400 hover:bg-cyan-500 hover:text-primary border-2 border-cyan-400`}
        >
            <QrCodeIcon className="h-6 w-6" />
            <span className="ml-3 font-bold">{t('sidebar.qrScanner')}</span>
        </div>
        {permissions.includes('assistant') && (
            <div
                onClick={() => onNavigate('assistant')}
                className={`flex items-center p-3 rounded-md cursor-pointer transition-colors duration-200 ${
                currentView === 'assistant' ? 'bg-yellow-500 text-primary' : 'text-yellow-400 hover:bg-yellow-500 hover:text-primary'
                } border-2 border-yellow-400`}
            >
                <SparklesIcon className="h-6 w-6" />
                <span className="ml-3 font-bold">{t('sidebar.aiAssistant')}</span>
            </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;