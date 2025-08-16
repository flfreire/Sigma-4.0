
import { User, UserRole } from '../types';
import { dbService } from './dbService';
import { DEFAULT_PERMISSIONS } from '../constants/permissions';

export const mockAuthService = {
  async register(name: string, email: string, password: string): Promise<Omit<User, 'password'>> {
    await dbService.openDb(); // Ensure DB is open
    
    const existingUser = await dbService.getUserByEmail(email);

    if (existingUser) {
        if (existingUser.password && existingUser.password !== 'TEMPORARY_PASSWORD') {
            throw new Error('User with this email already exists.');
        }
        const updatedUser = { ...existingUser, name, password };
        await dbService.updateUser(updatedUser);
        const { password: _, ...userToReturn } = updatedUser;
        return userToReturn;
    }
    
    const newUser: User = { 
      id: `user-${Date.now()}`, 
      name, 
      email, 
      password,
      role: UserRole.Technician,
      permissions: DEFAULT_PERMISSIONS[UserRole.Technician],
    };
    await dbService.addUser(newUser);
    
    const { password: _, ...userToReturn } = newUser;
    return userToReturn;
  },

  async login(email: string, password: string): Promise<User> {
    await new Promise(res => setTimeout(res, 500)); 
    await dbService.openDb(); 
    
    const user = await dbService.getUserByEmail(email);
    
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password.');
    }
    
    // Return the full user object, including role and permissions
    return user;
  },
};
