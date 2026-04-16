import { initialAdminData } from './mock/adminData';

const STORAGE_PREFIX = 'admin_';

export const adminStorage = {
    getItem: (key) => {
        if (typeof window === 'undefined') return null;
        try {
            const item = window.localStorage.getItem(STORAGE_PREFIX + key);
            // If item exists, parse it.
            // If not, fall back to initialData if available, otherwise return NULL (not []) as per updated requirement.
            // However, for lists like 'products', 'orders', we normally expect arrays. 
            // The user specifically requested returning null if key missing to differentiate.
            // But we must be careful with .map calls on the consumer side.
            // Let's follow the specific request but ensure helpers handle nulls.
            if (item) return JSON.parse(item);

            return initialAdminData[key] !== undefined ? initialAdminData[key] : null;

        } catch (error) {
            console.error(`Error reading ${key} from localStorage`, error);
            return initialAdminData[key] || null;
        }
    },

    setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage`, error);
        }
    },

    // CRUD Helpers
    getAll: (collection) => {
        const data = adminStorage.getItem(collection);
        return Array.isArray(data) ? data : [];
    },

    getById: (collection, id) => {
        const items = adminStorage.getAll(collection); // Safely returns array
        return items.find(item => item.id === id);
    },

    add: (collection, item) => {
        const items = adminStorage.getAll(collection);
        const newItem = { ...item, id: item.id || crypto.randomUUID(), createdAt: new Date().toISOString() };
        adminStorage.setItem(collection, [newItem, ...items]);
        return newItem;
    },

    update: (collection, id, updates) => {
        const items = adminStorage.getAll(collection);
        const updatedItems = items.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item);
        adminStorage.setItem(collection, updatedItems);
        return updatedItems.find(i => i.id === id);
    },

    delete: (collection, id) => {
        const items = adminStorage.getAll(collection);
        const filteredItems = items.filter(item => item.id !== id);
        adminStorage.setItem(collection, filteredItems);
    }
};
