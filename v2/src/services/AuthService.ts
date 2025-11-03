import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import config from 'config';
import { User, IUser } from '../models/User';
import { LoggerService } from './LoggerService';

export interface AuthPayload {
    userId: string;
    email: string;
    role: string;
}

export interface LoginResult {
    user: IUser;
    token: string;
}

export class AuthService {
    private static instance: AuthService;
    private logger = LoggerService.getInstance();

    private constructor() {}

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async register(email: string, username: string, password: string): Promise<LoginResult> {
        try {
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                throw new Error('Un utilisateur avec cet email ou nom d\'utilisateur existe déjà');
            }

            // Créer le nouvel utilisateur
            const user = new User({
                email,
                username,
                password,
                role: 'user'
            });

            await user.save();

            this.logger.logAuth('REGISTER', user._id.toString(), true);

            // Générer le token JWT
            const token = this.generateToken({
                userId: user._id.toString(),
                email: user.email,
                role: user.role
            });

            return { user, token };

        } catch (error) {
            this.logger.logError('REGISTER_ERROR', error);
            throw error;
        }
    }

    public async login(email: string, password: string): Promise<LoginResult> {
        try {
            // Trouver l'utilisateur par email
            const user = await User.findOne({ email }).select('+password');
            
            if (!user) {
                this.logger.logAuth('LOGIN', undefined, false);
                throw new Error('Email ou mot de passe incorrect');
            }

            // Vérifier le mot de passe
            const isPasswordValid = await user.comparePassword(password);
            
            if (!isPasswordValid) {
                this.logger.logAuth('LOGIN', user._id.toString(), false);
                throw new Error('Email ou mot de passe incorrect');
            }

            this.logger.logAuth('LOGIN', user._id.toString(), true);

            // Générer le token JWT
            const token = this.generateToken({
                userId: user._id.toString(),
                email: user.email,
                role: user.role
            });

            return { user, token };

        } catch (error) {
            this.logger.logError('LOGIN_ERROR', error);
            throw error;
        }
    }

    public generateToken(payload: AuthPayload): string {
        const secret = config.get<string>('security.jwt.secret') as Secret;
        const rawExpiresIn = config.get<string>('security.jwt.expiresIn');
        const options: SignOptions = {};
        if (rawExpiresIn) {
            // Cast explicite pour correspondre au type attendu par jsonwebtoken
            (options as any).expiresIn = rawExpiresIn;
        }
        return jwt.sign(payload, secret, options);
    }

    public verifyToken(token: string): AuthPayload {
        try {
            const secret = config.get<string>('security.jwt.secret') as Secret;
            return jwt.verify(token, secret) as AuthPayload;
        } catch (error) {
            throw new Error('Token invalide ou expiré');
        }
    }

    public async getUserById(userId: string): Promise<IUser | null> {
        try {
            return await User.findById(userId);
        } catch (error) {
            this.logger.logError('GET_USER_ERROR', error);
            throw error;
        }
    }
}
