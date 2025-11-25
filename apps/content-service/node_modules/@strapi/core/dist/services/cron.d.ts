import { Job, Spec } from 'node-schedule';
import type { Core } from '@strapi/types';
interface JobSpec {
    job: Job;
    options: Spec;
    name: string | null;
}
type TaskFn = ({ strapi }: {
    strapi: Core.Strapi;
}, ...args: unknown[]) => Promise<unknown>;
type Task = TaskFn | {
    task: TaskFn;
    options: Spec;
};
interface Tasks {
    [key: string]: Task;
}
declare const createCronService: () => {
    add(tasks?: Tasks): any;
    remove(name: string): any;
    start(): any;
    stop(): any;
    destroy(): any;
    jobs: JobSpec[];
};
export default createCronService;
//# sourceMappingURL=cron.d.ts.map