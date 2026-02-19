type SessionPayload<T> = {
  data: T;
  timestamp: number;
};

export class SessionManager {
  private static readonly SESSION_KEY = 'kv-generator-session';
  private static readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24小时

  static save<T>(data: T) {
    const session: SessionPayload<T> = {
      data,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  static load<T>(): T | null {
    try {
      const item = localStorage.getItem(this.SESSION_KEY);
      if (!item) return null;

      const session = JSON.parse(item) as SessionPayload<T>;
      const age = Date.now() - session.timestamp;

      if (age > this.MAX_AGE) {
        this.clear();
        return null;
      }

      return session.data;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  static clear() {
    localStorage.removeItem(this.SESSION_KEY);
  }

  static isExpired(): boolean {
    const item = localStorage.getItem(this.SESSION_KEY);
    if (!item) return true;

    try {
      const session = JSON.parse(item) as SessionPayload<unknown>;
      const age = Date.now() - session.timestamp;
      return age > this.MAX_AGE;
    } catch {
      return true;
    }
  }
}
