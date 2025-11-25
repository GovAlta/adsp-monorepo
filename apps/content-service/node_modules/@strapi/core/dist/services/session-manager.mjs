import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { DEFAULT_ALGORITHM } from '../constants.mjs';

class DatabaseSessionProvider {
    async create(session) {
        const result = await this.db.query(this.contentType).create({
            data: session
        });
        return result;
    }
    async findBySessionId(sessionId) {
        const result = await this.db.query(this.contentType).findOne({
            where: {
                sessionId
            }
        });
        return result;
    }
    async updateBySessionId(sessionId, data) {
        await this.db.query(this.contentType).update({
            where: {
                sessionId
            },
            data
        });
    }
    async deleteBySessionId(sessionId) {
        await this.db.query(this.contentType).delete({
            where: {
                sessionId
            }
        });
    }
    async deleteExpired() {
        await this.db.query(this.contentType).deleteMany({
            where: {
                absoluteExpiresAt: {
                    $lt: new Date()
                }
            }
        });
    }
    async deleteBy(criteria) {
        await this.db.query(this.contentType).deleteMany({
            where: {
                ...criteria.userId ? {
                    userId: criteria.userId
                } : {},
                ...criteria.origin ? {
                    origin: criteria.origin
                } : {},
                ...criteria.deviceId ? {
                    deviceId: criteria.deviceId
                } : {}
            }
        });
    }
    constructor(db, contentType){
        this.db = db;
        this.contentType = contentType;
    }
}
class OriginSessionManager {
    async generateRefreshToken(userId, deviceId, options) {
        return this.sessionManager.generateRefreshToken(userId, deviceId, this.origin, options);
    }
    async generateAccessToken(refreshToken) {
        return this.sessionManager.generateAccessToken(refreshToken, this.origin);
    }
    async rotateRefreshToken(refreshToken) {
        return this.sessionManager.rotateRefreshToken(refreshToken, this.origin);
    }
    validateAccessToken(token) {
        return this.sessionManager.validateAccessToken(token, this.origin);
    }
    async validateRefreshToken(token) {
        return this.sessionManager.validateRefreshToken(token, this.origin);
    }
    async invalidateRefreshToken(userId, deviceId) {
        return this.sessionManager.invalidateRefreshToken(this.origin, userId, deviceId);
    }
    /**
   * Returns true when a session exists and is not expired for this origin.
   * If the session exists but is expired, it will be deleted as part of this check.
   */ async isSessionActive(sessionId) {
        return this.sessionManager.isSessionActive(sessionId, this.origin);
    }
    constructor(sessionManager, origin){
        this.sessionManager = sessionManager;
        this.origin = origin;
    }
}
class SessionManager {
    /**
   * Define configuration for a specific origin
   */ defineOrigin(origin, config) {
        this.originConfigs.set(origin, config);
    }
    /**
   * Check if an origin is defined
   */ hasOrigin(origin) {
        return this.originConfigs.has(origin);
    }
    /**
   * Get configuration for a specific origin, throw error if not defined
   */ getConfigForOrigin(origin) {
        const originConfig = this.originConfigs.get(origin);
        if (originConfig) {
            return originConfig;
        }
        throw new Error(`SessionManager: Origin '${origin}' is not defined. Please define it using defineOrigin('${origin}', config).`);
    }
    /**
   * Get the appropriate JWT key based on the algorithm
   */ getJwtKey(config, algorithm, operation) {
        const isAsymmetric = algorithm.startsWith('RS') || algorithm.startsWith('ES') || algorithm.startsWith('PS');
        if (isAsymmetric) {
            // For asymmetric algorithms, check if user has provided proper key configuration
            if (operation === 'sign') {
                const privateKey = config.jwtOptions?.privateKey;
                if (privateKey) {
                    return privateKey;
                }
                throw new Error(`SessionManager: Private key is required for asymmetric algorithm ${algorithm}. Please configure admin.auth.options.privateKey.`);
            } else {
                const publicKey = config.jwtOptions?.publicKey;
                if (publicKey) {
                    return publicKey;
                }
                throw new Error(`SessionManager: Public key is required for asymmetric algorithm ${algorithm}. Please configure admin.auth.options.publicKey.`);
            }
        } else {
            if (!config.jwtSecret) {
                throw new Error(`SessionManager: Secret key is required for symmetric algorithm ${algorithm}`);
            }
            return config.jwtSecret;
        }
    }
    generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }
    async maybeCleanupExpired() {
        this.cleanupInvocationCounter += 1;
        if (this.cleanupInvocationCounter >= this.cleanupEveryCalls) {
            this.cleanupInvocationCounter = 0;
            await this.provider.deleteExpired();
        }
    }
    /**
   * Get the cleanup every calls threshold
   */ get cleanupThreshold() {
        return this.cleanupEveryCalls;
    }
    async generateRefreshToken(userId, deviceId, origin, options) {
        if (!origin || typeof origin !== 'string') {
            throw new Error('SessionManager: Origin parameter is required and must be a non-empty string');
        }
        await this.maybeCleanupExpired();
        const config = this.getConfigForOrigin(origin);
        const algorithm = config.algorithm || DEFAULT_ALGORITHM;
        const jwtKey = this.getJwtKey(config, algorithm, 'sign');
        const sessionId = this.generateSessionId();
        const tokenType = options?.type ?? 'refresh';
        const isRefresh = tokenType === 'refresh';
        const idleLifespan = isRefresh ? config.idleRefreshTokenLifespan : config.idleSessionLifespan;
        const maxLifespan = isRefresh ? config.maxRefreshTokenLifespan : config.maxSessionLifespan;
        const now = Date.now();
        const expiresAt = new Date(now + idleLifespan * 1000);
        const absoluteExpiresAt = new Date(now + maxLifespan * 1000);
        // Create the root record first so createdAt can be used for signing.
        const record = await this.provider.create({
            userId,
            sessionId,
            ...deviceId && {
                deviceId
            },
            origin,
            childId: null,
            type: tokenType,
            status: 'active',
            expiresAt,
            absoluteExpiresAt
        });
        const issuedAtSeconds = Math.floor(new Date(record.createdAt ?? new Date()).getTime() / 1000);
        const expiresAtSeconds = Math.floor(new Date(record.expiresAt).getTime() / 1000);
        const payload = {
            userId,
            sessionId,
            type: 'refresh',
            iat: issuedAtSeconds,
            exp: expiresAtSeconds
        };
        // Filter out conflicting options that are already handled by the payload or used for key selection
        const jwtOptions = config.jwtOptions || {};
        const { expiresIn, privateKey, publicKey, ...jwtSignOptions } = jwtOptions;
        const token = jwt.sign(payload, jwtKey, {
            algorithm,
            noTimestamp: true,
            ...jwtSignOptions
        });
        return {
            token,
            sessionId,
            absoluteExpiresAt: absoluteExpiresAt.toISOString()
        };
    }
    validateAccessToken(token, origin) {
        if (!origin || typeof origin !== 'string') {
            throw new Error('SessionManager: Origin parameter is required and must be a non-empty string');
        }
        try {
            const config = this.getConfigForOrigin(origin);
            const algorithm = config.algorithm || DEFAULT_ALGORITHM;
            const jwtKey = this.getJwtKey(config, algorithm, 'verify');
            const payload = jwt.verify(token, jwtKey, {
                algorithms: [
                    algorithm
                ],
                ...config.jwtOptions
            });
            // Ensure this is an access token
            if (!payload || payload.type !== 'access') {
                return {
                    isValid: false,
                    payload: null
                };
            }
            return {
                isValid: true,
                payload
            };
        } catch (err) {
            return {
                isValid: false,
                payload: null
            };
        }
    }
    async validateRefreshToken(token, origin) {
        if (!origin || typeof origin !== 'string') {
            throw new Error('SessionManager: Origin parameter is required and must be a non-empty string');
        }
        try {
            const config = this.getConfigForOrigin(origin);
            const algorithm = config.algorithm || DEFAULT_ALGORITHM;
            const jwtKey = this.getJwtKey(config, algorithm, 'verify');
            const verifyOptions = {
                algorithms: [
                    algorithm
                ],
                ...config.jwtOptions
            };
            const payload = jwt.verify(token, jwtKey, verifyOptions);
            if (payload.type !== 'refresh') {
                return {
                    isValid: false
                };
            }
            const session = await this.provider.findBySessionId(payload.sessionId);
            if (!session) {
                return {
                    isValid: false
                };
            }
            const now = new Date();
            if (new Date(session.expiresAt) <= now) {
                return {
                    isValid: false
                };
            }
            // Absolute family expiry check
            if (session.absoluteExpiresAt && new Date(session.absoluteExpiresAt) <= now) {
                return {
                    isValid: false
                };
            }
            // Only 'active' sessions are eligible to create access tokens.
            if (session.status !== 'active') {
                return {
                    isValid: false
                };
            }
            if (session.userId !== payload.userId) {
                return {
                    isValid: false
                };
            }
            return {
                isValid: true,
                userId: payload.userId,
                sessionId: payload.sessionId
            };
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                return {
                    isValid: false
                };
            }
            throw error;
        }
    }
    async invalidateRefreshToken(origin, userId, deviceId) {
        await this.provider.deleteBy({
            userId,
            origin,
            deviceId
        });
    }
    async generateAccessToken(refreshToken, origin) {
        if (!origin || typeof origin !== 'string') {
            throw new Error('SessionManager: Origin parameter is required and must be a non-empty string');
        }
        const validation = await this.validateRefreshToken(refreshToken, origin);
        if (!validation.isValid) {
            return {
                error: 'invalid_refresh_token'
            };
        }
        const payload = {
            userId: String(validation.userId),
            sessionId: validation.sessionId,
            type: 'access'
        };
        const config = this.getConfigForOrigin(origin);
        const algorithm = config.algorithm || DEFAULT_ALGORITHM;
        const jwtKey = this.getJwtKey(config, algorithm, 'sign');
        // Filter out conflicting options that are already handled by the payload or used for key selection
        const jwtOptions = config.jwtOptions || {};
        const { expiresIn, privateKey, publicKey, ...jwtSignOptions } = jwtOptions;
        const token = jwt.sign(payload, jwtKey, {
            algorithm,
            expiresIn: config.accessTokenLifespan,
            ...jwtSignOptions
        });
        return {
            token
        };
    }
    async rotateRefreshToken(refreshToken, origin) {
        if (!origin || typeof origin !== 'string') {
            throw new Error('SessionManager: Origin parameter is required and must be a non-empty string');
        }
        try {
            const config = this.getConfigForOrigin(origin);
            const algorithm = config.algorithm || DEFAULT_ALGORITHM;
            const jwtKey = this.getJwtKey(config, algorithm, 'verify');
            const payload = jwt.verify(refreshToken, jwtKey, {
                algorithms: [
                    algorithm
                ],
                ...config.jwtOptions
            });
            if (!payload || payload.type !== 'refresh') {
                return {
                    error: 'invalid_refresh_token'
                };
            }
            const current = await this.provider.findBySessionId(payload.sessionId);
            if (!current) {
                return {
                    error: 'invalid_refresh_token'
                };
            }
            // If parent already has a child, return the same child token
            if (current.childId) {
                const child = await this.provider.findBySessionId(current.childId);
                if (child) {
                    const childIat = Math.floor(new Date(child.createdAt ?? new Date()).getTime() / 1000);
                    const childExp = Math.floor(new Date(child.expiresAt).getTime() / 1000);
                    const childPayload = {
                        userId: child.userId,
                        sessionId: child.sessionId,
                        type: 'refresh',
                        iat: childIat,
                        exp: childExp
                    };
                    // Filter out conflicting options that are already handled by the payload
                    const { expiresIn, ...jwtSignOptions } = config.jwtOptions || {};
                    const childToken = jwt.sign(childPayload, jwtKey, {
                        algorithm,
                        noTimestamp: true,
                        ...jwtSignOptions
                    });
                    let absoluteExpiresAt;
                    if (child.absoluteExpiresAt) {
                        absoluteExpiresAt = typeof child.absoluteExpiresAt === 'string' ? child.absoluteExpiresAt : child.absoluteExpiresAt.toISOString();
                    } else {
                        absoluteExpiresAt = new Date(0).toISOString();
                    }
                    return {
                        token: childToken,
                        sessionId: child.sessionId,
                        absoluteExpiresAt,
                        type: child.type ?? 'refresh'
                    };
                }
            }
            const now = Date.now();
            const tokenType = current.type ?? 'refresh';
            const idleLifespan = tokenType === 'refresh' ? config.idleRefreshTokenLifespan : config.idleSessionLifespan;
            // Enforce idle window since creation of the current token
            if (current.createdAt && now - new Date(current.createdAt).getTime() > idleLifespan * 1000) {
                return {
                    error: 'idle_window_elapsed'
                };
            }
            // Enforce max family window using absoluteExpiresAt
            const absolute = current.absoluteExpiresAt ? new Date(current.absoluteExpiresAt).getTime() : now;
            if (absolute <= now) {
                return {
                    error: 'max_window_elapsed'
                };
            }
            // Create child token
            const childSessionId = this.generateSessionId();
            const childExpiresAt = new Date(now + idleLifespan * 1000);
            const childRecord = await this.provider.create({
                userId: current.userId,
                sessionId: childSessionId,
                ...current.deviceId && {
                    deviceId: current.deviceId
                },
                origin: current.origin,
                childId: null,
                type: tokenType,
                status: 'active',
                expiresAt: childExpiresAt,
                absoluteExpiresAt: current.absoluteExpiresAt ?? new Date(absolute)
            });
            const childIat = Math.floor(new Date(childRecord.createdAt ?? new Date()).getTime() / 1000);
            const childExp = Math.floor(new Date(childRecord.expiresAt).getTime() / 1000);
            const payloadOut = {
                userId: current.userId,
                sessionId: childSessionId,
                type: 'refresh',
                iat: childIat,
                exp: childExp
            };
            // Filter out conflicting options that are already handled by the payload
            const { expiresIn, ...jwtSignOptions } = config.jwtOptions || {};
            const childToken = jwt.sign(payloadOut, jwtKey, {
                algorithm,
                noTimestamp: true,
                ...jwtSignOptions
            });
            await this.provider.updateBySessionId(current.sessionId, {
                status: 'rotated',
                childId: childSessionId
            });
            let absoluteExpiresAt;
            if (childRecord.absoluteExpiresAt) {
                absoluteExpiresAt = typeof childRecord.absoluteExpiresAt === 'string' ? childRecord.absoluteExpiresAt : childRecord.absoluteExpiresAt.toISOString();
            } else {
                absoluteExpiresAt = new Date(absolute).toISOString();
            }
            return {
                token: childToken,
                sessionId: childSessionId,
                absoluteExpiresAt,
                type: tokenType
            };
        } catch  {
            return {
                error: 'invalid_refresh_token'
            };
        }
    }
    /**
   * Returns true when a session exists and is not expired.
   * If the session exists but is expired, it will be deleted as part of this check.
   */ async isSessionActive(sessionId, origin) {
        const session = await this.provider.findBySessionId(sessionId);
        if (!session) {
            return false;
        }
        if (session.origin !== origin) {
            return false;
        }
        if (new Date(session.expiresAt) <= new Date()) {
            // Clean up expired session eagerly
            await this.provider.deleteBySessionId(sessionId);
            return false;
        }
        return true;
    }
    constructor(provider){
        // Store origin-specific configurations
        this.originConfigs = new Map();
        // Run expired cleanup only every N calls to avoid extra queries
        this.cleanupInvocationCounter = 0;
        this.cleanupEveryCalls = 50;
        this.provider = provider;
    }
}
const createDatabaseProvider = (db, contentType)=>{
    return new DatabaseSessionProvider(db, contentType);
};
const createSessionManager = ({ db })=>{
    const provider = createDatabaseProvider(db, 'admin::session');
    const sessionManager = new SessionManager(provider);
    // Add callable functionality
    const fluentApi = (origin)=>{
        if (!origin || typeof origin !== 'string') {
            throw new Error('SessionManager: Origin parameter is required and must be a non-empty string');
        }
        return new OriginSessionManager(sessionManager, origin);
    };
    // Attach only the public SessionManagerService API to the callable
    const api = fluentApi;
    api.generateSessionId = sessionManager.generateSessionId.bind(sessionManager);
    api.defineOrigin = sessionManager.defineOrigin.bind(sessionManager);
    api.hasOrigin = sessionManager.hasOrigin.bind(sessionManager);
    // Note: isSessionActive is origin-scoped and exposed on OriginSessionManager only
    // Forward the cleanupThreshold getter (used in tests)
    Object.defineProperty(api, 'cleanupThreshold', {
        get () {
            return sessionManager.cleanupThreshold;
        },
        enumerable: true
    });
    return api;
};

export { createDatabaseProvider, createSessionManager };
//# sourceMappingURL=session-manager.mjs.map
