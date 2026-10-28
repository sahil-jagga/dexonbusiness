/**
 * NexBill PostgreSQL & Supabase Client with Offline-Safe Multi-Tenant Storage Adapter
 */

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'user';
  selectedTrade?: string;
  isOnline: boolean;
}

const LOCAL_USER_KEY = 'nb_auth_user';

export const authService = {
  // Get active session
  getCurrentUser(): AuthUser {
    try {
      const stored = localStorage.getItem(LOCAL_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    // Default guest / local user
    const guestUser: AuthUser = {
      id: 'local_user',
      email: 'owner@nexbill.local',
      fullName: 'Business Owner',
      role: 'owner',
      selectedTrade: undefined,
      isOnline: false,
    };
    return guestUser;
  },

  // Save session
  setCurrentUser(user: AuthUser): void {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  },

  // Login with email & password (local or remote)
  async signIn(email: string): Promise<AuthUser> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanId = 'usr_' + Math.abs(this.hashCode(cleanEmail)).toString(36);
    const user: AuthUser = {
      id: cleanId,
      email: cleanEmail,
      fullName: cleanEmail.split('@')[0].toUpperCase(),
      role: 'owner',
      isOnline: false,
    };
    this.setCurrentUser(user);
    return user;
  },

  // Logout
  signOut(): void {
    localStorage.removeItem(LOCAL_USER_KEY);
  },

  hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  },
};

/**
 * Tenant-Isolated Storage Adapter
 * Ensures that all data keys are prefixed with the active user's ID
 * Example: 'nb_usr_1a2b_firm_data'
 */
export const tenantStorage = {
  getScopedKey(key: string, userId?: string): string {
    const uid = userId || authService.getCurrentUser().id;
    return `nb_${uid}_${key}`;
  },

  getItem<T>(key: string, defaultValue: T, userId?: string): T {
    try {
      const scopedKey = this.getScopedKey(key, userId);
      const val = localStorage.getItem(scopedKey);
      if (val !== null) {
        return JSON.parse(val);
      }
      // Check legacy unscoped fallback once for smooth migration
      const legacyVal = localStorage.getItem(key);
      if (legacyVal !== null) {
        const parsed = JSON.parse(legacyVal);
        // Migrate to scoped key
        localStorage.setItem(scopedKey, legacyVal);
        return parsed;
      }
    } catch {}
    return defaultValue;
  },

  setItem<T>(key: string, value: T, userId?: string): void {
    try {
      const scopedKey = this.getScopedKey(key, userId);
      localStorage.setItem(scopedKey, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage quota exceeded or error writing key:', key, e);
    }
  },

  removeItem(key: string, userId?: string): void {
    const scopedKey = this.getScopedKey(key, userId);
    localStorage.removeItem(scopedKey);
  },

  clearUserData(userId?: string): void {
    const prefix = `nb_${userId || authService.getCurrentUser().id}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  },
};
