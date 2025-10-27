import React, { useState, useEffect } from 'react';
import { User, Team, UserRole, View, ActionPermission } from '../types';
import { useTranslation } from '../i18n/config';
import Modal from './Modal';
import { ALL_VIEWS, ALL_ACTIONS, DEFAULT_PERMISSIONS } from '../constants/permissions';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (user: any) => void;
    initialUser: User | null;
    teams: Team[];
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, initialUser, teams }) => {
    const { t } = useTranslation();
    const isEditMode = !!initialUser;
    const [formData, setFormData] = useState<any>({
        name: '',
        email: '',
        password: '',
        role: UserRole.Technician,
        teamId: '',
        permissions: DEFAULT_PERMISSIONS[UserRole.Technician].views,
        actionPermissions: DEFAULT_PERMISSIONS[UserRole.Technician].actions,
    });

    useEffect(() => {
        if (isEditMode && initialUser) {
            setFormData({
                ...initialUser,
                password: '', // Don't show existing password
                teamId: initialUser.teamId || '',
                actionPermissions: initialUser.actionPermissions || [],
            });
        } else {
             const { views, actions } = DEFAULT_PERMISSIONS[UserRole.Technician];
            setFormData({
                name: '', email: '', password: '', role: UserRole.Technician, teamId: '',
                permissions: views,
                actionPermissions: actions,
            });
        }
    }, [initialUser, isEditMode, isOpen]);

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as UserRole;
        const { views, actions } = DEFAULT_PERMISSIONS[newRole];
        setFormData((prev: any) => ({
            ...prev,
            role: newRole,
            permissions: views,
            actionPermissions: actions,
        }));
    };

    const handlePermissionChange = (view: View) => {
        setFormData((prev: any) => {
            const newPermissions = prev.permissions.includes(view)
                ? prev.permissions.filter((p: View) => p !== view)
                : [...prev.permissions, view];
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleActionPermissionChange = (action: ActionPermission) => {
        setFormData((prev: any) => {
            const newActionPermissions = prev.actionPermissions.includes(action)
                ? prev.actionPermissions.filter((p: ActionPermission) => p !== action)
                : [...prev.actionPermissions, action];
            return { ...prev, actionPermissions: newActionPermissions };
        });
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit = { ...formData };
        if (isEditMode) {
           dataToSubmit.id = initialUser!.id;
           if (!dataToSubmit.password) {
               delete dataToSubmit.password; // Don't send empty password
           }
        }
        onSubmit(dataToSubmit);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? t('userManagement.editUser') : t('userManagement.addUser')}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-highlight">{t('userManagement.form.name')}</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-highlight">{t('userManagement.form.email')}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-highlight">{t('userManagement.form.password')}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required={!isEditMode} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                    {isEditMode && <p className="text-xs text-highlight mt-1">{t('userManagement.form.passwordHelp')}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label className="block text-sm font-medium text-highlight">{t('userManagement.form.role')}</label>
                        <select name="role" value={formData.role} onChange={handleRoleChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                           {Object.values(UserRole).map(role => (
                               <option key={role} value={role}>{t(`enums.userRole.${role}`)}</option>
                           ))}
                        </select>
                    </div>
                     <div>
                         <label className="block text-sm font-medium text-highlight">{t('userManagement.form.team')}</label>
                        <select name="teamId" value={formData.teamId} onChange={handleChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                            <option value="">{t('userManagement.noTeam')}</option>
                           {teams.map(team => (
                               <option key={team.id} value={team.id}>{team.name}</option>
                           ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-highlight mb-2">{t('userManagement.form.permissions')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-primary rounded-md border border-accent">
                        {ALL_VIEWS.map(view => (
                            <label key={view} className="flex items-center space-x-2 text-sm text-light cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(view)}
                                    onChange={() => handlePermissionChange(view)}
                                    className="rounded bg-primary border-accent text-brand focus:ring-brand"
                                />
                                <span>{t(`sidebar.${view}`)}</span>
                            </label>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-highlight mb-2">{t('userManagement.form.actionPermissions')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-primary rounded-md border border-accent">
                        {ALL_ACTIONS.map(action => (
                            <label key={action} className="flex items-center space-x-2 text-sm text-light cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.actionPermissions.includes(action)}
                                    onChange={() => handleActionPermissionChange(action)}
                                    className="rounded bg-primary border-accent text-brand focus:ring-brand"
                                />
                                <span>{t(`userManagement.form.actions.${action}`)}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('userManagement.form.cancel')}</button>
                    <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('userManagement.form.save')}</button>
                </div>
            </form>
        </Modal>
    );
};

export default UserFormModal;