/**
 * Used to store user configurations related to releases.
 * E.g the default timezone for the release schedule.
 */
import type Koa from 'koa';
declare const settingsController: {
    find(ctx: Koa.Context): Promise<void>;
    update(ctx: Koa.Context): Promise<void>;
};
export default settingsController;
//# sourceMappingURL=settings.d.ts.map