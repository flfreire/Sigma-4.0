

import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/dbService';
import { Equipment, ServiceOrder, EquipmentStatus, MaintenanceType, ServiceOrderStatus, User, Team, ChatMessage, UserRole, PreventiveMaintenanceSchedule, ReplacementPart, Partner, ChecklistTemplate, ChecklistExecution, PartnerType } from '../types';
import { DEFAULT_PERMISSIONS } from '../constants/permissions';
import { useTranslation } from '../i18n/config';

const scheduleYears = 2;

const initialEquipment: Equipment[] = [
  {
    id: 'CNC-ROMI-001',
    name: 'Centro de Usinagem CNC',
    type: 'Machinery',
    model: 'D 800',
    manufacturer: 'ROMI',
    location: 'Setor de Usinagem',
    status: EquipmentStatus.Operational,
    installDate: '2022-01-15',
    usageHours: 4500,
    maintenanceHistory: [
      { date: '2023-10-20', description: 'Troca dos rolamentos do fuso.', type: MaintenanceType.Corrective },
      { date: '2024-03-01', description: 'Manutenção preventiva padrão.', type: MaintenanceType.Preventive },
    ],
    projectFiles: [],
  },
  {
    id: 'ROBO-KUKA-01',
    name: 'Robô Industrial',
    type: 'Automation',
    model: 'KR 210',
    manufacturer: 'KUKA',
    location: 'Linha de Montagem A',
    status: EquipmentStatus.InMaintenance,
    installDate: '2021-05-20',
    usageHours: 8200,
    maintenanceHistory: [
       { date: '2024-06-10', description: 'Lubrificação e inspeção trimestral.', type: MaintenanceType.Preventive },
    ],
    projectFiles: [],
  },
  {
    id: 'INJ-HAITIAN-05',
    name: 'Injetora de Plástico',
    type: 'Machinery',
    model: 'MA 3800',
    manufacturer: 'Haitian',
    location: 'Setor de Injeção',
    status: EquipmentStatus.NeedsRepair,
    installDate: '2023-02-10',
    usageHours: 6300,
    maintenanceHistory: [],
    projectFiles: [],
  },
   {
    id: 'FER-MBB-015',
    name: 'Dispositivo Montagem Eixo Traseiro MBB',
    type: 'Tooling',
    model: 'MBB-AXLE-JIG-01',
    manufacturer: 'Dispositran',
    location: 'Linha de Montagem MBB',
    status: EquipmentStatus.Operational,
    installDate: '2023-08-01',
    usageHours: 350,
    maintenanceHistory: [
       { date: '2024-02-01', description: 'Calibração anual.', type: MaintenanceType.Preventive },
    ],
    projectFiles: [],
  },
  {
    id: 'FER-VW-088',
    name: 'Gabarito de Solda Porta Dianteira Volks',
    type: 'Tooling',
    model: 'VW-DOOR-WELD-04',
    manufacturer: 'Gabaritech',
    location: 'Célula de Solda VW',
    status: EquipmentStatus.Operational,
    installDate: '2022-11-10',
    usageHours: 1240,
    maintenanceHistory: [],
    projectFiles: [],
  },
  {
    id: 'FER-VOL-009',
    name: 'Molde de Injeção Para-choque Volvo',
    type: 'Tooling',
    model: 'VOL-BUMP-MOLD-V2',
    manufacturer: 'Mold-Masters',
    location: 'Injeção Plástica Volvo',
    status: EquipmentStatus.Decommissioned,
    installDate: '2019-03-25',
    usageHours: 21500,
    maintenanceHistory: [],
    projectFiles: [],
  }
];

const initialTeams: Team[] = [
    {
        id: 'team-main-1',
        name: 'Equipe Principal de Manutenção',
        ownerId: 'user-1', // The admin user created in AuthContext
        members: ['user-1'],
    }
];

const initialServiceOrders: ServiceOrder[] = [
  {
    id: 'SO-2024-001',
    equipmentId: 'ROBO-KUKA-01',
    type: MaintenanceType.Preventive,
    status: ServiceOrderStatus.InProgress,
    description: 'Manutenção semestral programada.',
    scheduledDate: '2024-07-10',
    assignedToTeamId: 'team-main-1',
  },
  {
    id: 'SO-2024-002',
    equipmentId: 'INJ-HAITIAN-05',
    type: MaintenanceType.Corrective,
    status: ServiceOrderStatus.Open,
    description: 'Sistema hidráulico com vazamento.',
    scheduledDate: '2024-07-15',
    assignedToTeamId: 'team-main-1',
  },
   {
    id: 'SO-2024-003',
    equipmentId: 'CNC-ROMI-001',
    type: MaintenanceType.Rehabilitation,
    status: ServiceOrderStatus.Open,
    description: 'Reforma completa da máquina, incluindo nova pintura e atualização do controlador.',
    scheduledDate: '2024-08-01',
    assignedToTeamId: 'team-main-1',
    rehabilitationCost: 15000,
    photos: [],
  },
];

const initialReplacementParts: ReplacementPart[] = [
    { id: 'RP-001', equipmentId: 'CNC-ROMI-001', name: 'Rolamento do Fuso', code: 'SB-12345', stockQuantity: 10, supplier: 'Global Bearings Inc.' },
    { id: 'RP-002', equipmentId: 'CNC-ROMI-001', name: 'Bomba de Refrigeração', code: 'CP-67890', stockQuantity: 3, supplier: 'Industrial Pumps Co.' },
    { id: 'RP-003', equipmentId: 'ROBO-KUKA-01', name: 'Placa de Controle Eixo A3', code: 'KUKA-CB-A3-987', stockQuantity: 5, supplier: 'Precision Holdings' },
    { id: 'RP-004', equipmentId: 'INJ-HAITIAN-05', name: 'Bico de Injeção', code: 'HAITIAN-NOZ-050', stockQuantity: 52, supplier: 'WeldSupply Direct' },
];

const initialPartners: Partner[] = [
    { id: 'P-001', name: 'Global Bearings Inc.', type: PartnerType.Supplier, contactPerson: 'John Smith', phone: '555-1234', email: 'sales@globalbearings.com', address: '123 Industrial Park, Cityville' },
    { id: 'P-002', name: 'Industrial Pumps Co.', type: PartnerType.Supplier, contactPerson: 'Jane Doe', phone: '555-5678', email: 'contact@industrialpumps.com', address: '456 Pump Plaza, Townburg' },
    { id: 'P-003', name: 'Precision Holdings', type: PartnerType.ServiceProvider, contactPerson: 'Peter Jones', phone: '555-8765', email: 'info@precisionholdings.net', address: '789 Tech Avenue, Metropolis' },
    { id: 'P-004', name: 'WeldSupply Direct', type: PartnerType.Supplier, contactPerson: 'Susan Miller', phone: '555-4321', email: 'support@welddirect.com', address: '101 Welders Way, Villagetown' },
    { id: 'P-005', name: 'Mercado Livre', type: PartnerType.Supplier, contactPerson: 'N/A', phone: 'N/A', email: 'N/A', address: 'Online Marketplace' },
];

const calculateNextDate = (startDate: Date, schedule: PreventiveMaintenanceSchedule): Date | null => {
    if (schedule === PreventiveMaintenanceSchedule.None) return null;

    const date = new Date(startDate);
    
    const scheduleMonths: Record<PreventiveMaintenanceSchedule, number> = {
        [PreventiveMaintenanceSchedule.Monthly]: 1,
        [PreventiveMaintenanceSchedule.Bimonthly]: 2,
        [PreventiveMaintenanceSchedule.Trimonthly]: 3,
        [PreventiveMaintenanceSchedule.Semiannual]: 6,
        [PreventiveMaintenanceSchedule.Annual]: 12,
        [PreventiveMaintenanceSchedule.None]: 0,
    };

    if (scheduleMonths[schedule]) {
      // Use setUTCMonth to avoid timezone-related day shifts
      date.setUTCMonth(date.getUTCMonth() + scheduleMonths[schedule]);
    }
    
    return date;
};


export const useDbData = (userId?: string) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [replacementParts, setReplacementParts] = useState<ReplacementPart[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [checklistExecutions, setChecklistExecutions] = useState<ChecklistExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  
  const _generateFutureSOs = useCallback((equipmentItem: Equipment): ServiceOrder[] => {
      if (!equipmentItem.preventiveSchedule || equipmentItem.preventiveSchedule === PreventiveMaintenanceSchedule.None) {
          return [];
      }

      const newSOs: ServiceOrder[] = [];
      let nextDate = new Date(equipmentItem.installDate);
      const endDate = new Date(equipmentItem.installDate);
      endDate.setFullYear(endDate.getFullYear() + scheduleYears);

      const scheduleText = t(`enums.preventiveMaintenanceSchedule.${equipmentItem.preventiveSchedule}`);
      const description = t('equipment.autoScheduled', { schedule: scheduleText });

      while (true) {
          const calculatedDate = calculateNextDate(nextDate, equipmentItem.preventiveSchedule);
          if (!calculatedDate || calculatedDate > endDate) {
              break;
          }
          
          nextDate = calculatedDate;
          const nextDateString = nextDate.toISOString().split('T')[0];
          
          const newSO: Omit<ServiceOrder, 'id'> = {
              equipmentId: equipmentItem.id,
              type: MaintenanceType.Preventive,
              status: ServiceOrderStatus.Open,
              description,
              scheduledDate: nextDateString,
              assignedToTeamId: undefined,
          };
          newSOs.push({ ...newSO, id: `SO-PREV-${equipmentItem.id}-${Date.now() + newSOs.length}`});
      }
      return newSOs;
  }, [t]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        await dbService.openDb();

        const [existingEquipment, existingOrders, existingUsers, existingTeams, existingParts, existingPartners, existingTemplates, existingExecutions] = await Promise.all([
            dbService.getAllEquipment(),
            dbService.getAllServiceOrders(),
            dbService.getAllUsers(),
            dbService.getAllTeams(),
            dbService.getAllReplacementParts(),
            dbService.getAllPartners(),
            dbService.getAllChecklistTemplates(),
            dbService.getAllChecklistExecutions(),
        ]);

        if (existingEquipment.length === 0) {
            await Promise.all(initialEquipment.map(e => dbService.addEquipment(e)));
            setEquipment(initialEquipment);
        } else {
            setEquipment(existingEquipment);
        }

        if (existingTeams.length === 0) {
            await Promise.all(initialTeams.map(t => dbService.addTeam(t)));
            setTeams(initialTeams);
             // Assign admin to the initial team
            const adminUser = existingUsers.find(u => u.id === 'user-1');
            if (adminUser && !adminUser.teamId) {
                const updatedAdmin = { ...adminUser, teamId: initialTeams[0].id };
                await dbService.updateUser(updatedAdmin);
                setUsers(prevUsers => prevUsers.map(u => u.id === 'user-1' ? updatedAdmin : u));
            }
        } else {
            setTeams(existingTeams);
        }

        if (existingOrders.length === 0) {
            await Promise.all(initialServiceOrders.map(o => dbService.addServiceOrder(o)));
            setServiceOrders(initialServiceOrders);
        } else {
            setServiceOrders(existingOrders);
        }

        if (existingParts.length === 0) {
            await Promise.all(initialReplacementParts.map(p => dbService.addReplacementPart(p)));
            setReplacementParts(initialReplacementParts);
        } else {
            setReplacementParts(existingParts);
        }

        if (existingPartners.length === 0) {
            await Promise.all(initialPartners.map(p => dbService.addPartner(p)));
            setPartners(initialPartners);
        } else {
            setPartners(existingPartners);
        }
        
        setUsers(existingUsers);
        setChecklistTemplates(existingTemplates);
        setChecklistExecutions(existingExecutions);

        const currentUser = existingUsers.find(u => u.id === userId);
        if (currentUser?.teamId) {
            const messages = await dbService.getChatMessagesByTeam(currentUser.teamId);
            setChatMessages(messages);
        } else {
            setChatMessages([]);
        }

    } catch (error) {
        console.error("Failed to initialize database:", error);
    } finally {
        setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const addEquipment = async (item: Omit<Equipment, 'id' | 'maintenanceHistory' | 'nextPreventiveMaintenanceDate'>) => {
    const newItem: Equipment = { ...item, maintenanceHistory: [], projectFiles: [], id: `EQ-${Date.now()}` };
    
    const futureSOs = _generateFutureSOs(newItem);

    if (futureSOs.length > 0) {
        newItem.nextPreventiveMaintenanceDate = futureSOs[0].scheduledDate;
        await Promise.all(futureSOs.map(so => dbService.addServiceOrder(so)));
        setServiceOrders(prev => [...prev, ...futureSOs]);
    }

    await dbService.addEquipment(newItem);
    setEquipment(prev => [...prev, newItem]);
  };
  
  const updateEquipment = async (updatedItem: Equipment) => {
     const oldItem = equipment.find(e => e.id === updatedItem.id);

     const scheduleChanged = oldItem?.preventiveSchedule !== updatedItem.preventiveSchedule;
     const installDateChanged = oldItem?.installDate !== updatedItem.installDate;

     if (scheduleChanged || (installDateChanged && updatedItem.preventiveSchedule !== PreventiveMaintenanceSchedule.None)) {
        const openPreventiveSOs = serviceOrders.filter(
            o => o.equipmentId === updatedItem.id &&
                 o.type === MaintenanceType.Preventive &&
                 o.status === ServiceOrderStatus.Open
        );

        const cancellationPromises = openPreventiveSOs.map(order => 
            dbService.updateServiceOrder({ ...order, status: ServiceOrderStatus.Cancelled })
        );
        await Promise.all(cancellationPromises);
        
        const cancelledIds = new Set(openPreventiveSOs.map(o => o.id));
        let ordersToUpdate = serviceOrders.map(o => cancelledIds.has(o.id) ? { ...o, status: ServiceOrderStatus.Cancelled } : o);

        const futureSOs = _generateFutureSOs(updatedItem);
        
        if (futureSOs.length > 0) {
            updatedItem.nextPreventiveMaintenanceDate = futureSOs[0].scheduledDate;
            await Promise.all(futureSOs.map(so => dbService.addServiceOrder(so)));
            ordersToUpdate.push(...futureSOs);
        } else {
            updatedItem.nextPreventiveMaintenanceDate = undefined;
        }
        
        setServiceOrders(ordersToUpdate);
     }

     await dbService.updateEquipment(updatedItem);
     setEquipment(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };
  
  const getEquipmentById = (id: string) => {
    return equipment.find(e => e.id === id);
  }

  const addServiceOrder = async (order: Omit<ServiceOrder, 'id'>) => {
    const newOrder: ServiceOrder = { ...order, id: `SO-${Date.now()}` };
    await dbService.addServiceOrder(newOrder);
    setServiceOrders(prev => [...prev, newOrder]);
     if(order.type === MaintenanceType.Corrective) {
        await updateEquipmentStatus(order.equipmentId, EquipmentStatus.NeedsRepair);
     } else if (order.status !== ServiceOrderStatus.Completed && order.status !== ServiceOrderStatus.Cancelled){
        await updateEquipmentStatus(order.equipmentId, EquipmentStatus.InMaintenance);
     }
  };
  
  const updateServiceOrder = async (updatedOrder: ServiceOrder) => {
     await dbService.updateServiceOrder(updatedOrder);
     let currentSOs = serviceOrders.map(item => item.id === updatedOrder.id ? updatedOrder : item);
     
     if (updatedOrder.status === ServiceOrderStatus.Completed) {
        await updateEquipmentStatus(updatedOrder.equipmentId, EquipmentStatus.Operational);

        if (updatedOrder.type === MaintenanceType.Preventive) {
            const equipmentToUpdate = equipment.find(e => e.id === updatedOrder.equipmentId);
            if (equipmentToUpdate?.preventiveSchedule && equipmentToUpdate.preventiveSchedule !== PreventiveMaintenanceSchedule.None) {
                
                const allPreventiveSOs = [...currentSOs]
                    .filter(so => so.equipmentId === updatedOrder.equipmentId && so.type === MaintenanceType.Preventive)
                    .sort((a,b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
                
                const lastSO = allPreventiveSOs.length > 0 ? allPreventiveSOs[allPreventiveSOs.length - 1] : updatedOrder;
                
                const nextDateAfterLast = calculateNextDate(new Date(lastSO.scheduledDate), equipmentToUpdate.preventiveSchedule);

                if(nextDateAfterLast) {
                    const scheduleText = t(`enums.preventiveMaintenanceSchedule.${equipmentToUpdate.preventiveSchedule}`);
                    const description = t('equipment.autoScheduled', { schedule: scheduleText });
                    const nextDateString = nextDateAfterLast.toISOString().split('T')[0];

                    const newSO: Omit<ServiceOrder, 'id'> = {
                        equipmentId: equipmentToUpdate.id,
                        type: MaintenanceType.Preventive,
                        status: ServiceOrderStatus.Open,
                        description,
                        scheduledDate: nextDateString,
                        assignedToTeamId: undefined, // Let it be assigned manually later
                    };
                    
                    await dbService.addServiceOrder({ ...newSO, id: `SO-PREV-${Date.now()}` });
                    currentSOs.push({ ...newSO, id: `SO-PREV-${Date.now()}` });
                }
                
                const firstOpenSO = currentSOs
                    .filter(so => so.equipmentId === updatedOrder.equipmentId && so.type === MaintenanceType.Preventive && so.status === ServiceOrderStatus.Open)
                    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];
                
                const updatedEquipment = { ...equipmentToUpdate, nextPreventiveMaintenanceDate: firstOpenSO?.scheduledDate };
                await dbService.updateEquipment(updatedEquipment);
                setEquipment(prev => prev.map(e => e.id === updatedEquipment.id ? updatedEquipment : e));
            }
        }
     } else if (updatedOrder.status === ServiceOrderStatus.InProgress || updatedOrder.status === ServiceOrderStatus.Open) {
        if(updatedOrder.type === MaintenanceType.Corrective) {
            await updateEquipmentStatus(updatedOrder.equipmentId, EquipmentStatus.NeedsRepair);
        } else {
            await updateEquipmentStatus(updatedOrder.equipmentId, EquipmentStatus.InMaintenance);
        }
     }
     setServiceOrders(currentSOs);
  };

  const updateEquipmentStatus = async (equipmentId: string, status: EquipmentStatus) => {
      const equip = getEquipmentById(equipmentId);
      if(equip && equip.status !== status) {
          await updateEquipment({...equip, status});
      }
  };

  // Replacement Parts Management
    const addReplacementPart = async (item: Omit<ReplacementPart, 'id'>) => {
        const newItem: ReplacementPart = { ...item, id: `RP-${Date.now()}` };
        await dbService.addReplacementPart(newItem);
        setReplacementParts(prev => [...prev, newItem]);
    };

    const updateReplacementPart = async (updatedItem: ReplacementPart) => {
        await dbService.updateReplacementPart(updatedItem);
        setReplacementParts(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    const deleteReplacementPart = async (partId: string) => {
        await dbService.deleteReplacementPart(partId);
        setReplacementParts(prev => prev.filter(item => item.id !== partId));
    };
  
    // Partner Management
    const addPartner = async (item: Omit<Partner, 'id'>) => {
        const newItem: Partner = { ...item, id: `P-${Date.now()}` };
        await dbService.addPartner(newItem);
        setPartners(prev => [...prev, newItem]);
    };

    const updatePartner = async (updatedItem: Partner) => {
        await dbService.updatePartner(updatedItem);
        setPartners(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    const deletePartner = async (partnerId: string) => {
        await dbService.deletePartner(partnerId);
        setPartners(prev => prev.filter(item => item.id !== partnerId));
    };


  // User Management
  const addUser = async (user: Omit<User, 'id'>) => {
      const newUser = { ...user, id: `user-${Date.now()}` };
      await dbService.addUser(newUser);
      setUsers(prev => [...prev, newUser]);
      if(newUser.teamId) {
        await assignUserToTeam(newUser.id, newUser.teamId);
      }
  };
  
  const updateUser = async (updatedUser: User) => {
      const oldUser = users.find(u => u.id === updatedUser.id);
      
      await dbService.updateUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

      // If team has changed, update team memberships
      if (oldUser && oldUser.teamId !== updatedUser.teamId) {
          let newTeamsState = [...teams];

          // Remove from old team
          if (oldUser.teamId) {
              const oldTeam = newTeamsState.find(t => t.id === oldUser.teamId);
              if (oldTeam) {
                  const updatedOldTeam = { ...oldTeam, members: oldTeam.members.filter(id => id !== updatedUser.id) };
                  await dbService.updateTeam(updatedOldTeam);
                  newTeamsState = newTeamsState.map(t => t.id === oldUser.teamId ? updatedOldTeam : t);
              }
          }

          // Add to new team
          if (updatedUser.teamId) {
              const newTeam = newTeamsState.find(t => t.id === updatedUser.teamId);
              if (newTeam && !newTeam.members.includes(updatedUser.id)) {
                  const updatedNewTeam = { ...newTeam, members: [...newTeam.members, updatedUser.id] };
                  await dbService.updateTeam(updatedNewTeam);
                  newTeamsState = newTeamsState.map(t => t.id === updatedUser.teamId ? updatedNewTeam : t);
              }
          }
          
          setTeams(newTeamsState);
      }
  };

  const deleteUser = async (userId: string) => {
      const userToDelete = users.find(u => u.id === userId);
      if (userToDelete?.teamId) {
          const team = teams.find(t => t.id === userToDelete.teamId);
          if (team && team.ownerId !== userId) {
             await removeTeamMember(team, userId);
          } else if (team && team.ownerId === userId) {
            // Future: handle team ownership transfer or deletion
            console.warn("Deletion of team owner is not fully supported. Team may become orphaned.");
          }
      }
      await dbService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
  };


  // Team Management
  const createTeam = async (name: string, ownerId: string) => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name,
      ownerId,
      members: [ownerId]
    };
    await dbService.addTeam(newTeam);
    setTeams(prev => [...prev, newTeam]);
    
    const owner = users.find(u => u.id === ownerId);
    if(owner && owner.role !== UserRole.Admin) {
        const updatedOwner = {...owner, teamId: newTeam.id};
        await dbService.updateUser(updatedOwner);
        setUsers(prev => prev.map(u => u.id === ownerId ? updatedOwner : u));
    }
    return newTeam;
  };

  const addTeamMember = async (team: Team, email: string) => {
    let member = await dbService.getUserByEmail(email);

    if (member) {
        if (team.members.includes(member.id)) {
            throw new Error(t('team.errorAlreadyInTeam', { email }));
        }
        if (member.teamId && member.teamId !== team.id) {
            throw new Error(t('team.errorInAnotherTeam', { email }));
        }
    }
    
    let memberId: string;

    if (!member) {
        // User does not exist, create a new one.
        const newUser: User = {
            id: `user-${Date.now()}`,
            name: email.split('@')[0],
            email: email,
            password: 'TEMPORARY_PASSWORD', // placeholder password
            teamId: team.id,
            role: UserRole.Technician,
            permissions: DEFAULT_PERMISSIONS[UserRole.Technician]
        };
        await dbService.addUser(newUser);
        setUsers(prev => [...prev, newUser]);
        memberId = newUser.id;
    } else {
        // User exists but has no team, add them to this one.
        memberId = member.id;
        const updatedMember = {...member, teamId: team.id };
        await dbService.updateUser(updatedMember);
        setUsers(prev => prev.map(u => u.id === memberId ? updatedMember : u));
    }
    
    const updatedTeam = { ...team, members: [...team.members, memberId] };
    await dbService.updateTeam(updatedTeam);
    setTeams(prev => prev.map(t => t.id === team.id ? updatedTeam : t));
  };

  const removeTeamMember = async (team: Team, memberId: string) => {
    const updatedTeam = { ...team, members: team.members.filter(id => id !== memberId) };
    await dbService.updateTeam(updatedTeam);
    setTeams(prev => prev.map(t => t.id === team.id ? updatedTeam : t));

    const member = await dbService.getUserById(memberId);
    if (member) {
        const { teamId, ...rest } = member;
        await dbService.updateUser(rest);
        setUsers(prev => prev.map(u => u.id === memberId ? rest : u));
    }
  };

  const assignUserToTeam = async (userId: string, newTeamId: string | null) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    const oldTeamId = userToUpdate.teamId;
    if (oldTeamId === newTeamId) return;

    let newTeamsState = [...teams];

    if (oldTeamId) {
      const oldTeam = newTeamsState.find(t => t.id === oldTeamId);
      if (oldTeam) {
        const updatedOldTeam = { ...oldTeam, members: oldTeam.members.filter(id => id !== userId) };
        await dbService.updateTeam(updatedOldTeam);
        newTeamsState = newTeamsState.map(t => t.id === oldTeamId ? updatedOldTeam : t);
      }
    }

    if (newTeamId) {
      const newTeam = newTeamsState.find(t => t.id === newTeamId);
      if (newTeam && !newTeam.members.includes(userId)) {
        const updatedNewTeam = { ...newTeam, members: [...newTeam.members, userId] };
        await dbService.updateTeam(updatedNewTeam);
        newTeamsState = newTeamsState.map(t => t.id === newTeamId ? updatedNewTeam : t);
      }
    }
    
    setTeams(newTeamsState);
    
    const updatedUser: User = { ...userToUpdate };
    if (newTeamId) {
      updatedUser.teamId = newTeamId;
    } else {
      delete updatedUser.teamId;
    }
    
    await dbService.updateUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? updatedUser : u));
  };


  const addChatMessage = async (text: string) => {
    if (!userId) return;

    const user = users.find(u => u.id === userId);
    if (!user || !user.teamId) {
        console.error("User is not in a team, cannot send message.");
        return;
    }

    const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        teamId: user.teamId,
        userId: user.id,
        userName: user.name,
        text: text.trim(),
        timestamp: Date.now(),
    };

    await dbService.addChatMessage(newMessage);
    setChatMessages(prev => [...prev, newMessage]);
  };

  // Checklist Management
    const addChecklistTemplate = async (template: Omit<ChecklistTemplate, 'id'>) => {
        const newTemplate = { ...template, id: `ct-${Date.now()}` };
        await dbService.addChecklistTemplate(newTemplate);
        setChecklistTemplates(prev => [...prev, newTemplate]);
    };

    const updateChecklistTemplate = async (template: ChecklistTemplate) => {
        await dbService.updateChecklistTemplate(template);
        setChecklistTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    };
    
    const deleteChecklistTemplate = async (id: string) => {
        // First, check if any equipment uses this template
        const isUsed = equipment.some(e => e.checklistTemplateId === id);
        if (isUsed) {
            alert("This template cannot be deleted because it is currently assigned to one or more pieces of equipment.");
            return;
        }
        await dbService.deleteChecklistTemplate(id);
        setChecklistTemplates(prev => prev.filter(t => t.id !== id));
    };

    const addChecklistExecution = async (execution: Omit<ChecklistExecution, 'id'>, serviceOrder: ServiceOrder) => {
        const newExecution = { ...execution, id: `ce-${Date.now()}` };
        await dbService.addChecklistExecution(newExecution);
        setChecklistExecutions(prev => [...prev, newExecution]);
        
        // Link execution to service order and mark as completed
        const updatedOrder = { ...serviceOrder, checklistExecutionId: newExecution.id, status: ServiceOrderStatus.Completed };
        await updateServiceOrder(updatedOrder);
    };

    const getChecklistExecutionById = (id: string) => {
        return checklistExecutions.find(e => e.id === id);
    }

  return { 
    equipment, 
    serviceOrders, 
    replacementParts,
    partners,
    users,
    teams,
    chatMessages,
    checklistTemplates,
    checklistExecutions,
    isLoading,
    addEquipment, 
    updateEquipment, 
    addServiceOrder, 
    updateServiceOrder, 
    addReplacementPart,
    updateReplacementPart,
    deleteReplacementPart,
    addPartner,
    updatePartner,
    deletePartner,
    createTeam,
    addTeamMember,
    removeTeamMember,
    assignUserToTeam,
    addChatMessage,
    addUser,
    updateUser,
    deleteUser,
    addChecklistTemplate,
    updateChecklistTemplate,
    deleteChecklistTemplate,
    addChecklistExecution,
    getChecklistExecutionById
  };
};