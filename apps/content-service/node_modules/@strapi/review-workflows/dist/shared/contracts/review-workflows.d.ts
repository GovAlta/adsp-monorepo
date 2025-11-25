import type { UID, Modules } from '@strapi/types';
import type { Permission } from '@strapi/admin/strapi-admin';
import type { errors } from '@strapi/utils';
type Entity = Modules.EntityService.Result<UID.Schema>;
/**
 * /content-manager/<collection-type | single-type>/:model/:id/assignee
 */
declare namespace UpdateAssignee {
    interface Request {
        body: {
            data: {
                id: Entity['id'] | null;
            };
        };
        query: {};
    }
    interface Params {
        model: string;
        id: Entity['id'];
    }
    interface Response {
        data: Entity;
        error?: errors.ApplicationError;
    }
}
interface StagePermission extends Omit<Permission, 'createdAt' | 'updatedAt' | 'properties' | 'conditions'> {
    role: number;
}
interface Stage extends Entity {
    color: string;
    name: string;
    permissions?: StagePermission[];
}
/**
 * GET /content-manager/<collection-type | single-type>/:model/:id/stages
 */
declare namespace GetStages {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        model: string;
        id: Entity['id'];
    }
    interface Response {
        data: Stage[];
        meta?: {
            workflowCount: number;
        };
        error?: errors.ApplicationError;
    }
}
/**
 * PUT /content-manager/<collection-type | single-type>/:model/:id/stage
 */
declare namespace UpdateStage {
    interface Request {
        body: {
            data: {
                id: Entity['id'];
            };
        };
        query: {};
    }
    interface Params {
        model: string;
        id: Entity['id'];
    }
    interface Response {
        data: Entity;
        error?: errors.ApplicationError;
    }
}
interface Stage extends Entity {
    color: string;
    name: string;
    permissions?: StagePermission[];
}
interface Workflow extends Entity {
    name: string;
    contentTypes: string[];
    stages: Stage[];
    stageRequiredToPublish: Stage | null;
}
declare namespace GetAll {
    interface Request {
        body: {};
        query: Modules.EntityService.Params.Pick<'admin::review-workflow', 'filters' | 'populate:array'>;
    }
    interface Response {
        data: Workflow[];
        meta?: {
            workflowCount: number;
        };
        error?: errors.ApplicationError;
    }
}
declare namespace Update {
    interface Request {
        body: {
            data: Partial<Omit<Workflow, 'stageRequiredToPublish'>> & {
                stageRequiredToPublishName?: Stage['name'] | null;
            };
        };
        query: {};
    }
    interface Params {
        id: Entity['id'];
    }
    interface Response {
        data: Workflow;
        error?: errors.ApplicationError;
    }
}
declare namespace Create {
    interface Request {
        body: {
            data: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> & {
                stageRequiredToPublishName?: Stage['name'] | null;
            };
        };
        query: {};
    }
    interface Response {
        data: Workflow;
        error?: errors.ApplicationError;
    }
}
declare namespace Delete {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: Entity['id'];
    }
    interface Response {
        data: Workflow;
        error?: errors.ApplicationError;
    }
}
export type { Stage, Workflow, GetAll, Update, Create, Delete, UpdateAssignee, UpdateStage, GetStages, StagePermission, };
