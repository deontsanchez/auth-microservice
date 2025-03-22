import { container } from './container';
import * as authService from '../../services/authService';
import * as userService from '../../services/userService';

// Register auth services
container.register('authService', authService);

// Register user services
container.register('userService', userService);

export { container };
