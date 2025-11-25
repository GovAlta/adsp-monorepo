import type { Algorithm } from 'jsonwebtoken';
import type { Database } from '@strapi/database';
export interface SessionProvider {
    create(session: SessionData): Promise<SessionData>;
    findBySessionId(sessionId: string): Promise<SessionData | null>;
    updateBySessionId(sessionId: string, data: Partial<SessionData>): Promise<void>;
    deleteBySessionId(sessionId: string): Promise<void>;
    deleteExpired(): Promise<void>;
    deleteBy(criteria: {
        userId?: string;
        origin?: string;
        deviceId?: string;
    }): Promise<void>;
}
export interface SessionData {
    id?: string;
    userId: string;
    sessionId: string;
    deviceId?: string;
    origin: string;
    childId?: string | null;
    type?: 'refresh' | 'session';
    status?: 'active' | 'rotated' | 'revoked';
    expiresAt: Date;
    absoluteExpiresAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface RefreshTokenPayload {
    userId: string;
    sessionId: string;
    type: 'refresh';
    exp: number;
    iat: number;
}
export interface AccessTokenPayload {
    userId: string;
    sessionId: string;
    type: 'access';
    exp: number;
    iat: number;
}
export type TokenPayload = RefreshTokenPayload | AccessTokenPayload;
export interface ValidateRefreshTokenResult {
    isValid: boolean;
    userId?: string;
    sessionId?: string;
    error?: 'invalid_token' | 'token_expired' | 'session_not_found' | 'session_expired' | 'wrong_token_type';
}
export interface SessionManagerConfig {
    jwtSecret?: string;
    accessTokenLifespan: number;
    maxRefreshTokenLifespan: number;
    idleRefreshTokenLifespan: number;
    maxSessionLifespan: number;
    idleSessionLifespan: number;
    algorithm?: Algorithm;
    jwtOptions?: Record<string, unknown>;
}
declare class OriginSessionManager {
    private sessionManager;
    private origin;
    constructor(sessionManager: SessionManager, origin: string);
    generateRefreshToken(userId: string, deviceId: string | undefined, options?: {
        type?: 'refresh' | 'session';
    }): Promise<{
        token: string;
        sessionId: string;
        absoluteExpiresAt: string;
    }>;
    generateAccessToken(refreshToken: string): Promise<{
        token: string;
    } | {
        error: string;
    }>;
    rotateRefreshToken(refreshToken: string): Promise<{
        token: string;
        sessionId: string;
        absoluteExpiresAt: string;
        type: 'refresh' | 'session';
    } | {
        error: string;
    }>;
    validateAccessToken(token: string): {
        isValid: true;
        payload: AccessTokenPayload;
    } | {
        isValid: false;
        payload: null;
    };
    validateRefreshToken(token: string): Promise<ValidateRefreshTokenResult>;
    invalidateRefreshToken(userId: string, deviceId?: string): Promise<void>;
    /**
     * Returns true when a session exists and is not expired for this origin.
     * If the session exists but is expired, it will be deleted as part of this check.
     */
    isSessionActive(sessionId: string): Promise<boolean>;
}
declare class SessionManager {
    private provider;
    private originConfigs;
    private cleanupInvocationCounter;
    private readonly cleanupEveryCalls;
    constructor(provider: SessionProvider);
    /**
     * Define configuration for a specific origin
     */
    defineOrigin(origin: string, config: SessionManagerConfig): void;
    /**
     * Check if an origin is defined
     */
    hasOrigin(origin: string): boolean;
    /**
     * Get configuration for a specific origin, throw error if not defined
     */
    private getConfigForOrigin;
    /**
     * Get the appropriate JWT key based on the algorithm
     */
    private getJwtKey;
    generateSessionId(): string;
    private maybeCleanupExpired;
    /**
     * Get the cleanup every calls threshold
     */
    get cleanupThreshold(): number;
    generateRefreshToken(userId: string, deviceId: string | undefined, origin: string, options?: {
        type?: 'refresh' | 'session';
    }): Promise<{
        token: string;
        sessionId: string;
        absoluteExpiresAt: string;
    }>;
    validateAccessToken(token: string, origin: string): {
        isValid: true;
        payload: AccessTokenPayload;
    } | {
        isValid: false;
        payload: null;
    };
    validateRefreshToken(token: string, origin: string): Promise<ValidateRefreshTokenResult>;
    invalidateRefreshToken(origin: string, userId: string, deviceId?: string): Promise<void>;
    generateAccessToken(refreshToken: string, origin: string): Promise<{
        token: string;
    } | {
        error: string;
    }>;
    rotateRefreshToken(refreshToken: string, origin: string): Promise<{
        token: string;
        sessionId: string;
        absoluteExpiresAt: string;
        type: 'refresh' | 'session';
    } | {
        error: string;
    }>;
    /**
     * Returns true when a session exists and is not expired.
     * If the session exists but is expired, it will be deleted as part of this check.
     */
    isSessionActive(sessionId: string, origin: string): Promise<boolean>;
}
declare const createDatabaseProvider: (db: Database, contentType: string) => SessionProvider;
declare const createSessionManager: ({ db, }: {
    db: Database;
}) => SessionManager & ((origin: string) => OriginSessionManager);
export { createSessionManager, createDatabaseProvider };
//# sourceMappingURL=session-manager.d.ts.map