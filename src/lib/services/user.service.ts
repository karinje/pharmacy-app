import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { User } from '$lib/types';

class UserService {
  private readonly COLLECTION = 'users';

  /**
   * Create new user document
   */
  async createUser(user: Omit<User, 'createdAt' | 'lastLoginAt'> & { createdAt: Date; lastLoginAt: Date }): Promise<void> {
    const userRef = doc(db, this.COLLECTION, user.uid);
    await setDoc(userRef, {
      ...user,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  }

  /**
   * Get user document
   */
  async getUser(uid: string): Promise<User | null> {
    const userRef = doc(db, this.COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }

    return userSnap.data() as User;
  }

  /**
   * Update last login time
   */
  async updateLastLogin(uid: string): Promise<void> {
    const userRef = doc(db, this.COLLECTION, uid);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp()
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(uid: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, this.COLLECTION, uid);
    await updateDoc(userRef, data);
  }
}

export const userService = new UserService();

