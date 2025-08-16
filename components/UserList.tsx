import React, { useState } from 'react';
import { User, Team, UserRole } from '../types';
import { useTranslation } from '../i18n/config';
import { UsersIcon, PlusIcon } from './icons';
import UserFormModal from './UserFormModal';

interface UserListProps {
  users: User[];
  teams: Team[];
  currentUser: User;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const UserList: React.FC<UserListProps> = ({ users, teams, currentUser, addUser, updateUser, deleteUser }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const isAdmin = currentUser.role === UserRole.Admin;

  const getTeamName = (teamId?: string): string => {
    if (!teamId) return t('users.noTeam');
    const team = teams.find(t => t.id === teamId);
    return team?.name || t('users.noTeam');
  };
  
  const usersToDisplay = users.filter(u => u.id !== currentUser.id);

  const handleOpenAddModal = () => { setEditingUser(null); setIsModalOpen(true); };
  const handleOpenEditModal = (user: User) => { setEditingUser(user); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingUser(null); };

  const handleSaveUser = async (userData: any) => {
    if (editingUser) {
        await updateUser(userData);
    } else {
        await addUser(userData);
    }
    handleCloseModal();
  };

  const handleDeleteUser = (user: User) => {
      if (window.confirm(t('userManagement.deleteUserConfirm', { userName: user.name }))) {
          deleteUser(user.id);
      }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-light flex items-center">
            <UsersIcon className="h-8 w-8 mr-3 text-brand" />
            {t('users.title')}
        </h2>
        {isAdmin && (
           <button onClick={handleOpenAddModal} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('userManagement.addUser')}
            </button>
        )}
      </div>
      <div className="bg-secondary rounded-lg shadow-md border border-accent overflow-x-auto">
        <table className="min-w-full divide-y divide-accent">
          <thead className="bg-primary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('users.headers.name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('users.headers.email')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('users.headers.team')}</th>
              {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('userManagement.headers.actions')}</th>}
            </tr>
          </thead>
          <tbody className="bg-secondary divide-y divide-accent">
            {usersToDisplay.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-light">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-light">{getTeamName(user.teamId)}</td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleOpenEditModal(user)} className="text-brand hover:text-blue-400">{t('equipment.edit')}</button>
                    <button onClick={() => handleDeleteUser(user)} className="text-red-500 hover:text-red-400">{t('userManagement.deleteUser')}</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {usersToDisplay.length === 0 && (
            <p className="text-center text-highlight p-8">No other users have registered yet.</p>
        )}
      </div>
      {isAdmin && (
        <UserFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleSaveUser}
            initialUser={editingUser}
            teams={teams}
        />
      )}
    </div>
  );
};

export default UserList;
