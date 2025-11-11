import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type UserCredential
} from 'firebase/auth';
import { auth } from '$lib/config/firebase';
import { userService } from './user.service';
import { handleFirebaseError } from '$lib/utils/errors';

class AuthService {
  /**
   * Sign up a new user
   */
  async signup(email: string, password: string, displayName?: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Create user document in Firestore
      await userService.createUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: displayName,
        role: 'pharmacist',
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      return userCredential;
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  /**
   * Sign in existing user
   */
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      await userService.updateLastLogin(userCredential.user.uid);
      
      return userCredential;
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth.currentUser;
  }
}

export const authService = new AuthService();

