import React, { useState, useMemo } from 'react';
import { User, Team } from '../types';
import { useTranslation } from '../i18n/config';
import { PlusIcon, TrashIcon, UsersIcon } from './icons';

interface TeamManagementProps {
    currentUser: User;
    team: Team | null;
    allUsers: User[];
    createTeam: (name: string, ownerId: string) => Promise<Team>;
    addTeamMember: (team: Team, email: string) => Promise<void>;
    removeTeamMember: (team: Team, memberId: string) => Promise<void>;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ 
    currentUser, 
    team,
    allUsers,
    createTeam, 
    addTeamMember,
    removeTeamMember
}) => {
  const { t } = useTranslation();
  const [teamName, setTeamName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
        setError("Team name cannot be empty.");
        return;
    }
    await createTeam(teamName, currentUser.id);
    setTeamName('');
    setError(null);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim() || !team) return;
    try {
        await addTeamMember(team, memberEmail);
        setMemberEmail('');
        setError(null);
    } catch(err: any) {
        setError(err.message);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (!team) return;
    if (window.confirm(t('team.removeMemberConfirm'))) {
        removeTeamMember(team, memberId);
    }
  };

  const teamMembers = useMemo(() => {
    if (!team) return [];
    return team.members
      .map(memberId => allUsers.find(u => u.id === memberId))
      .filter((u): u is User => !!u);
  }, [team, allUsers]);

  if (!team) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <UsersIcon className="h-16 w-16 text-accent mb-4"/>
        <h2 className="text-2xl font-bold text-light mb-2">{t('team.createPrompt')}</h2>
        <form onSubmit={handleCreateTeam} className="w-full max-w-sm mt-4">
          <label htmlFor="teamName" className="sr-only">{t('team.teamNameLabel')}</label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder={t('team.teamNamePlaceholder')}
            className="w-full bg-primary border border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand"
            required
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button type="submit" className="mt-4 w-full bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
            {t('team.createButton')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-light flex items-center">
            <UsersIcon className="h-8 w-8 mr-3 text-brand"/>
            {t('team.title')}: <span className="text-brand ml-2">{team.name}</span>
        </h2>
      </div>

      <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent">
        <h3 className="text-xl font-bold text-light mb-2">{t('team.membersTitle')}</h3>
        <div className="divide-y divide-accent">
          {teamMembers.map(member => (
            <div key={member.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-light">{member.name} {member.id === currentUser.id && '(You)'}</p>
                <p className="text-sm text-highlight">{member.email}</p>
              </div>
              {member.id !== currentUser.id && (
                <button 
                  onClick={() => handleRemoveMember(member.id)} 
                  className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10"
                  aria-label={`Remove ${member.name}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent">
        <h3 className="text-xl font-bold text-light mb-2">{t('team.addMemberPrompt')}</h3>
        <form onSubmit={handleAddMember} className="flex items-end space-x-3 mt-4">
          <div className="flex-grow">
            <label htmlFor="memberEmail" className="block text-sm font-medium text-highlight mb-1">{t('team.emailLabel')}</label>
            <input
              id="memberEmail"
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              className="w-full bg-primary border border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand"
              required
            />
          </div>
          <button type="submit" className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center h-10">
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('team.addButton')}
          </button>
        </form>
         {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default TeamManagement;