import React, { useState, useMemo } from 'react';
import { User, Team, UserRole } from '../types';
import { useTranslation } from '../i18n/config';
import { UserGroupIcon, PlusIcon, TrashIcon, UsersIcon, KeyIcon } from './icons';
import UserFormModal from './UserFormModal';

interface ManagementProps {
    currentUser: User;
    users: User[];
    teams: Team[];
    team: Team | null; // The current user's team
    assignUserToTeam: (userId: string, teamId: string | null) => Promise<void>;
    createTeam: (name: string, ownerId: string) => Promise<Team>;
    addTeamMember: (team: Team, email: string) => Promise<void>;
    removeTeamMember: (team: Team, memberId: string) => Promise<void>;
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
}

const UserManagement: React.FC<ManagementProps> = ({
    currentUser, users, teams, team,
    assignUserToTeam, createTeam, addTeamMember, removeTeamMember,
    addUser, updateUser, deleteUser
}) => {
    const { t } = useTranslation();
    const isAdmin = currentUser.role === UserRole.Admin;

    // States are now managed within their respective view components (Admin or Team Owner)
    
    if (isAdmin) {
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [editingUser, setEditingUser] = useState<User | null>(null);
        const [newTeamName, setNewTeamName] = useState('');
        const [addMemberEmail, setAddMemberEmail] = useState('');
        const [error, setError] = useState<string | null>(null);
        const [targetTeamIdForAdd, setTargetTeamIdForAdd] = useState<string | null>(null);

        const regularUsers = users.filter(u => u.role !== UserRole.Admin);
        
        const handleOpenAddModal = () => { setEditingUser(null); setIsModalOpen(true); };
        const handleOpenEditModal = (user: User) => { setEditingUser(user); setIsModalOpen(true); };
        const handleCloseModal = () => { setIsModalOpen(false); setEditingUser(null); };

        const handleSaveUser = async (userData: User) => {
            if (editingUser) {
                await updateUser(userData);
            } else {
                await addUser(userData);
            }
            handleCloseModal();
        };

        const handleDeleteUser = (user: User) => {
            if(window.confirm(t('userManagement.deleteUserConfirm', { userName: user.name }))) {
                deleteUser(user.id);
            }
        };

        const handleCreateTeam = async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);
            if (!newTeamName.trim()) { setError("Team name cannot be empty."); return; }
            try {
                // When an admin creates a team, they are the owner
                await createTeam(newTeamName, currentUser.id);
                setNewTeamName('');
            } catch (err: any) {
                setError(err.message);
            }
        };

        const handleAdminAddMember = async (e: React.FormEvent, team: Team) => {
            e.preventDefault();
            setError(null);
            if (!addMemberEmail.trim()) return;
            try {
                await addTeamMember(team, addMemberEmail);
                setAddMemberEmail('');
                setTargetTeamIdForAdd(null);
            } catch (err: any) {
                setError(err.message);
                // Don't clear email on error so user can correct it
            }
        };
        
        const handleAdminRemoveMember = (team: Team, memberId: string) => {
            if (team.ownerId === memberId) {
                alert("The team owner cannot be removed.");
                return;
            }
            if (window.confirm(t('team.removeMemberConfirm'))) {
                removeTeamMember(team, memberId);
            }
        };


        return (
            <div className="p-6 space-y-8">
                <h2 className="text-3xl font-bold text-light flex items-center">
                    <UserGroupIcon className="h-8 w-8 mr-3 text-brand"/>
                    {t('userManagement.title')}
                </h2>
                
                <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-light">{t('userManagement.usersTitle')}</h3>
                        <button onClick={handleOpenAddModal} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            {t('userManagement.addUser')}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-accent">
                            <thead className="bg-primary">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('userManagement.headers.name')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('userManagement.headers.role')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('userManagement.headers.team')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('userManagement.headers.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-secondary divide-y divide-accent">
                                {regularUsers.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium text-light">{user.name}</p>
                                            <p className="text-xs text-highlight">{user.email}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-light">{t(`enums.userRole.${user.role}`)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-light">{teams.find(t => t.id === user.teamId)?.name || t('userManagement.noTeam')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                            <button onClick={() => handleOpenEditModal(user)} className="text-brand hover:text-blue-400">{t('equipment.edit')}</button>
                                            <button onClick={() => handleDeleteUser(user)} className="text-red-500 hover:text-red-400">{t('userManagement.deleteUser')}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {regularUsers.length === 0 && <p className="text-center text-highlight p-8">No other users have registered yet.</p>}
                    </div>
                </div>
                 <UserFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSaveUser}
                    initialUser={editingUser}
                    teams={teams}
                />
                 <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent">
                    <h3 className="text-xl font-bold text-light mb-4">{t('userManagement.teamsTitle')}</h3>
                    <div className="mb-6 border-b border-accent pb-6">
                        <h4 className="text-lg font-semibold text-light mb-2">{t('userManagement.createTeamPrompt')}</h4>
                        <form onSubmit={handleCreateTeam} className="flex items-center space-x-3">
                            <input type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder={t('userManagement.teamNameLabel')} className="flex-grow bg-primary border border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand" required />
                            <button type="submit" className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600">{t('userManagement.createButton')}</button>
                        </form>
                    </div>
                     <div>
                        <h4 className="text-lg font-semibold text-light mb-4">{t('userManagement.existingTeams')}</h4>
                        <div className="space-y-4">
                            {teams.map(tItem => (
                                <div key={tItem.id} className="bg-primary p-4 rounded-lg border border-accent">
                                    <div className="flex justify-between items-center mb-3">
                                        <h5 className="font-bold text-brand text-lg">{tItem.name}</h5>
                                        <button onClick={() => { setTargetTeamIdForAdd(tItem.id); setAddMemberEmail(''); setError(null);}} className="bg-accent text-light font-bold py-1 px-3 rounded-md hover:bg-highlight flex items-center text-sm">
                                            <PlusIcon className="h-4 w-4 mr-2" />
                                            {t('team.addButton')}
                                        </button>
                                    </div>
                                    <ul className="divide-y divide-accent/50 mb-4">
                                        {tItem.members.map(memberId => {
                                            const member = users.find(u => u.id === memberId);
                                            if (!member) return null;
                                            const isOwner = tItem.ownerId === memberId;
                                            return (
                                                <li key={memberId} className="flex items-center justify-between py-2">
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-light">{member.name}</span>
                                                        {isOwner && <span title="Team Owner"><KeyIcon className="h-4 w-4 ml-2 text-yellow-400" /></span>}
                                                    </div>
                                                    {!isOwner && <button onClick={() => handleAdminRemoveMember(tItem, memberId)} className="text-red-500 hover:text-red-400 p-1 rounded-full"><TrashIcon className="h-4 w-4"/></button>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    {targetTeamIdForAdd === tItem.id && (
                                        <form onSubmit={(e) => handleAdminAddMember(e, tItem)} className="mt-4 pt-4 border-t border-accent/50">
                                            <p className="text-sm text-highlight mb-2">{t('team.addMemberPrompt')}</p>
                                            <div className="flex items-end space-x-3">
                                                <div className="flex-grow">
                                                    <label htmlFor={`add-email-${tItem.id}`} className="sr-only">{t('team.emailLabel')}</label>
                                                    <input id={`add-email-${tItem.id}`} type="email" value={addMemberEmail} onChange={e => setAddMemberEmail(e.target.value)} placeholder={t('team.emailLabel')} className="w-full bg-secondary border border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand" required autoFocus/>
                                                </div>
                                                <button type="submit" className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 h-10">Add</button>
                                                <button type="button" onClick={() => setTargetTeamIdForAdd(null)} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight h-10">Cancel</button>
                                            </div>
                                            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                                        </form>
                                    )}
                                </div>
                            ))}
                            {teams.length === 0 && <p className="text-center text-highlight p-4">No teams created yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Team View for non-admins
    const [ownerNewTeamName, setOwnerNewTeamName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [error, setError] = useState<string | null>(null);

    const isOwner = team?.ownerId === currentUser.id;

    const teamMembers = useMemo(() => {
        if (!team) return [];
        return team.members
        .map(memberId => users.find(u => u.id === memberId))
        .filter((u): u is User => !!u);
    }, [team, users]);

    const handleCreateTeamOwner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ownerNewTeamName.trim()) { setError("Team name cannot be empty."); return; }
        await createTeam(ownerNewTeamName, currentUser.id);
        setOwnerNewTeamName('');
        setError(null);
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberEmail.trim() || !team) return;
        try {
            await addTeamMember(team, memberEmail);
            setMemberEmail('');
            setError(null);
        } catch(err: any) { setError(err.message); }
    };

    const handleRemoveMember = (memberId: string) => {
        if (!team) return;
        if (window.confirm(t('team.removeMemberConfirm'))) {
            removeTeamMember(team, memberId);
        }
    };

    if (!team) {
        return (
             <div className="p-6 flex flex-col items-center justify-center h-full text-center">
                <UsersIcon className="h-16 w-16 text-accent mb-4"/>
                <h2 className="text-2xl font-bold text-light mb-2">{t('team.createPrompt')}</h2>
                <form onSubmit={handleCreateTeamOwner} className="w-full max-w-sm mt-4">
                    <label htmlFor="teamName" className="sr-only">{t('team.teamNameLabel')}</label>
                    <input id="teamName" type="text" value={ownerNewTeamName} onChange={(e) => setOwnerNewTeamName(e.target.value)} placeholder={t('team.teamNamePlaceholder')}
                        className="w-full bg-primary border border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand" required />
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
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-light">{t('team.membersTitle')}</h3>
                    {isOwner && <p className="text-sm text-yellow-400 flex items-center"><KeyIcon className="h-4 w-4 mr-2"/> You are the team owner</p>}
                </div>
                <div className="divide-y divide-accent">
                    {teamMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-semibold text-light">{member.name} {member.id === currentUser.id && `(${t('team.you')})`}</p>
                                <p className="text-sm text-highlight">{member.email}</p>
                            </div>
                            {isOwner && member.id !== currentUser.id && (
                                <button onClick={() => handleRemoveMember(member.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10" aria-label={`Remove ${member.name}`}>
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {isOwner && (
                <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent">
                    <h3 className="text-xl font-bold text-light mb-4">{t('team.addMemberModalTitle')}</h3>
                    <p className="text-sm text-highlight mb-4">{t('team.addMemberPrompt')}</p>
                    <form onSubmit={handleAddMember} className="flex items-end space-x-3">
                        <div className="flex-grow">
                            <label htmlFor="memberEmail" className="block text-sm font-medium text-highlight mb-1">{t('team.emailLabel')}</label>
                            <input id="memberEmail" type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)}
                                className="w-full bg-primary border border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand" required />
                        </div>
                        <button type="submit" className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center h-10">
                           <PlusIcon className="h-5 w-5 mr-2" />
                           {t('team.addButton')}
                        </button>
                    </form>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
               </div>
            )}
        </div>
    );
};

export default UserManagement;