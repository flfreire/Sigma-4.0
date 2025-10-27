

import { Equipment, ServiceOrder, User, Team, ChatMessage, ReplacementPart, Partner, ChecklistTemplate, ChecklistExecution, FailureMode, Quote, MeasurementInstrument, ServiceCategory } from '../types';

const DB_NAME = 'Sigma4DB';
const DB_VERSION = 11; // Incremented version for schema change
const EQUIPMENT_STORE = 'equipment';
const ORDERS_STORE = 'serviceOrders';
const USERS_STORE = 'users';
const TEAMS_STORE = 'teams';
const CHAT_MESSAGES_STORE = 'chatMessages';
const REPLACEMENT_PARTS_STORE = 'replacementParts';
const PARTNERS_STORE = 'partners';
const CHECKLIST_TEMPLATES_STORE = 'checklistTemplates';
const CHECKLIST_EXECUTIONS_STORE = 'checklistExecutions';
const FAILURE_MODES_STORE = 'failureModes';
const QUOTES_STORE = 'quotes';
const METROLOGY_STORE = 'measurementInstruments';
const SERVICE_CATEGORIES_STORE = 'serviceCategories';


let db: IDBDatabase;

const openDb = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database error:', request.error);
            reject('Database error: ' + request.error);
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            const oldVersion = event.oldVersion;
            
            if (!dbInstance.objectStoreNames.contains(EQUIPMENT_STORE)) {
                dbInstance.createObjectStore(EQUIPMENT_STORE, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(ORDERS_STORE)) {
                dbInstance.createObjectStore(ORDERS_STORE, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(USERS_STORE)) {
                const userStore = dbInstance.createObjectStore(USERS_STORE, { keyPath: 'id' });
                userStore.createIndex('email', 'email', { unique: true });
            }
            if (!dbInstance.objectStoreNames.contains(TEAMS_STORE)) {
                const teamStore = dbInstance.createObjectStore(TEAMS_STORE, { keyPath: 'id' });
                teamStore.createIndex('ownerId', 'ownerId', { unique: false });
            }
            if (!dbInstance.objectStoreNames.contains(CHAT_MESSAGES_STORE)) {
                const chatStore = dbInstance.createObjectStore(CHAT_MESSAGES_STORE, { keyPath: 'id' });
                chatStore.createIndex('teamId_timestamp', ['teamId', 'timestamp'], { unique: false });
            }
             if (!dbInstance.objectStoreNames.contains(REPLACEMENT_PARTS_STORE)) {
                const partsStore = dbInstance.createObjectStore(REPLACEMENT_PARTS_STORE, { keyPath: 'id' });
                partsStore.createIndex('equipmentId', 'equipmentId', { unique: false });
            }
            if (!dbInstance.objectStoreNames.contains(PARTNERS_STORE)) {
                dbInstance.createObjectStore(PARTNERS_STORE, { keyPath: 'id' });
            }
            if (oldVersion < 7 && dbInstance.objectStoreNames.contains('suppliers')) {
                dbInstance.deleteObjectStore('suppliers');
            }
            if (!dbInstance.objectStoreNames.contains(CHECKLIST_TEMPLATES_STORE)) {
                dbInstance.createObjectStore(CHECKLIST_TEMPLATES_STORE, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(CHECKLIST_EXECUTIONS_STORE)) {
                const executionsStore = dbInstance.createObjectStore(CHECKLIST_EXECUTIONS_STORE, { keyPath: 'id' });
                executionsStore.createIndex('serviceOrderId', 'serviceOrderId', { unique: false });
                executionsStore.createIndex('equipmentId', 'equipmentId', { unique: false });
            }
            if (!dbInstance.objectStoreNames.contains(FAILURE_MODES_STORE)) {
                const failureModesStore = dbInstance.createObjectStore(FAILURE_MODES_STORE, { keyPath: 'id' });
                failureModesStore.createIndex('equipmentType', 'equipmentType', { unique: false });
            }
            if (!dbInstance.objectStoreNames.contains(QUOTES_STORE)) {
                const quotesStore = dbInstance.createObjectStore(QUOTES_STORE, { keyPath: 'id' });
                quotesStore.createIndex('partnerId', 'partnerId', { unique: false });
            }
            if (!dbInstance.objectStoreNames.contains(METROLOGY_STORE)) {
                dbInstance.createObjectStore(METROLOGY_STORE, { keyPath: 'id' });
            }
             if (!dbInstance.objectStoreNames.contains(SERVICE_CATEGORIES_STORE)) {
                dbInstance.createObjectStore(SERVICE_CATEGORIES_STORE, { keyPath: 'id' });
            }
        };
    });
};

const getStore = (storeName: string, mode: IDBTransactionMode) => {
    const transaction = db.transaction(storeName, mode);
    transaction.onabort = (event) => {
      console.error(`Transaction aborted for store ${storeName}`, event);
    }
    transaction.onerror = (event) => {
      console.error(`Transaction error for store ${storeName}`, event);
    }
    return transaction.objectStore(storeName);
};

const get = <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readonly');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = () => reject(request.error);
    });
}

const getAll = <T>(storeName: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
    });
};

const add = <T>(storeName: string, item: T): Promise<IDBValidKey> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.add(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const update = <T>(storeName: string, item: T): Promise<IDBValidKey> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.put(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const del = (storeName: string, key: IDBValidKey): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const dbService = {
    openDb,
    // Equipment
    getAllEquipment: () => getAll<Equipment>(EQUIPMENT_STORE),
    addEquipment: (item: Equipment) => add<Equipment>(EQUIPMENT_STORE, item),
    updateEquipment: (item: Equipment) => update<Equipment>(EQUIPMENT_STORE, item),
    deleteEquipment: (id: string) => del(EQUIPMENT_STORE, id),
    
    // Measurement Instruments
    getAllMeasurementInstruments: () => getAll<MeasurementInstrument>(METROLOGY_STORE),
    addMeasurementInstrument: (item: MeasurementInstrument) => add<MeasurementInstrument>(METROLOGY_STORE, item),
    updateMeasurementInstrument: (item: MeasurementInstrument) => update<MeasurementInstrument>(METROLOGY_STORE, item),
    deleteMeasurementInstrument: (id: string) => del(METROLOGY_STORE, id),

    // Service Orders
    getAllServiceOrders: () => getAll<ServiceOrder>(ORDERS_STORE),
    addServiceOrder: (item: ServiceOrder) => add<ServiceOrder>(ORDERS_STORE, item),
    updateServiceOrder: (item: ServiceOrder) => update<ServiceOrder>(ORDERS_STORE, item),

    // Replacement Parts
    getAllReplacementParts: () => getAll<ReplacementPart>(REPLACEMENT_PARTS_STORE),
    addReplacementPart: (item: ReplacementPart) => add<ReplacementPart>(REPLACEMENT_PARTS_STORE, item),
    updateReplacementPart: (item: ReplacementPart) => update<ReplacementPart>(REPLACEMENT_PARTS_STORE, item),
    deleteReplacementPart: (partId: string) => del(REPLACEMENT_PARTS_STORE, partId),

    // Partners
    getAllPartners: () => getAll<Partner>(PARTNERS_STORE),
    addPartner: (item: Partner) => add<Partner>(PARTNERS_STORE, item),
    updatePartner: (item: Partner) => update<Partner>(PARTNERS_STORE, item),
    deletePartner: (partnerId: string) => del(PARTNERS_STORE, partnerId),

    // Users
    getAllUsers: () => getAll<User>(USERS_STORE),
    getUserById: (id: string) => get<User>(USERS_STORE, id),
    getUserByEmail: (email: string): Promise<User | undefined> => {
        return new Promise((resolve, reject) => {
            const store = getStore(USERS_STORE, 'readonly');
            const index = store.index('email');
            const request = index.get(email);
            request.onsuccess = () => resolve(request.result as User | undefined);
            request.onerror = () => reject(request.error);
        });
    },
    addUser: (user: User) => add<User>(USERS_STORE, user),
    updateUser: (user: User) => update<User>(USERS_STORE, user),
    deleteUser: (userId: string) => del(USERS_STORE, userId),

    // Teams
    getAllTeams: () => getAll<Team>(TEAMS_STORE),
    addTeam: (team: Team) => add<Team>(TEAMS_STORE, team),
    updateTeam: (team: Team) => update<Team>(TEAMS_STORE, team),

    // Chat Messages
    getChatMessagesByTeam: (teamId: string): Promise<ChatMessage[]> => {
        return new Promise((resolve, reject) => {
            const store = getStore(CHAT_MESSAGES_STORE, 'readonly');
            const index = store.index('teamId_timestamp');
            const range = IDBKeyRange.bound([teamId, -Infinity], [teamId, Infinity]);
            const request = index.getAll(range);
            request.onsuccess = () => resolve(request.result as ChatMessage[]);
            request.onerror = () => reject(request.error);
        });
    },
    addChatMessage: (item: ChatMessage) => add<ChatMessage>(CHAT_MESSAGES_STORE, item),
    
    // Checklist Templates
    getAllChecklistTemplates: () => getAll<ChecklistTemplate>(CHECKLIST_TEMPLATES_STORE),
    addChecklistTemplate: (item: ChecklistTemplate) => add<ChecklistTemplate>(CHECKLIST_TEMPLATES_STORE, item),
    updateChecklistTemplate: (item: ChecklistTemplate) => update<ChecklistTemplate>(CHECKLIST_TEMPLATES_STORE, item),
    deleteChecklistTemplate: (id: string) => del(CHECKLIST_TEMPLATES_STORE, id),

    // Checklist Executions
    getAllChecklistExecutions: () => getAll<ChecklistExecution>(CHECKLIST_EXECUTIONS_STORE),
    addChecklistExecution: (item: ChecklistExecution) => add<ChecklistExecution>(CHECKLIST_EXECUTIONS_STORE, item),
    getChecklistExecution: (id: string) => get<ChecklistExecution>(CHECKLIST_EXECUTIONS_STORE, id),

    // Failure Modes
    getAllFailureModes: () => getAll<FailureMode>(FAILURE_MODES_STORE),
    addFailureMode: (item: FailureMode) => add<FailureMode>(FAILURE_MODES_STORE, item),
    updateFailureMode: (item: FailureMode) => update<FailureMode>(FAILURE_MODES_STORE, item),
    deleteFailureMode: (id: string) => del(FAILURE_MODES_STORE, id),
    
    // Quotes
    getAllQuotes: () => getAll<Quote>(QUOTES_STORE),
    addQuote: (item: Quote) => add<Quote>(QUOTES_STORE, item),
    updateQuote: (item: Quote) => update<Quote>(QUOTES_STORE, item),
    deleteQuote: (id: string) => del(QUOTES_STORE, id),

    // Service Categories
    getAllServiceCategories: () => getAll<ServiceCategory>(SERVICE_CATEGORIES_STORE),
    addServiceCategory: (item: ServiceCategory) => add<ServiceCategory>(SERVICE_CATEGORIES_STORE, item),
    updateServiceCategory: (item: ServiceCategory) => update<ServiceCategory>(SERVICE_CATEGORIES_STORE, item),
    deleteServiceCategory: (id: string) => del(SERVICE_CATEGORIES_STORE, id),
};