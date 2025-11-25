import { Stage as IStage } from '../../../../../shared/contracts/review-workflows';
interface WorkflowStage extends Pick<IStage, 'id' | 'name' | 'permissions' | 'color'> {
    __temp_key__: string;
}
interface StagesProps {
    canDelete?: boolean;
    canUpdate?: boolean;
    isCreating?: boolean;
}
declare const Stages: ({ canDelete, canUpdate, isCreating }: StagesProps) => import("react/jsx-runtime").JSX.Element;
export { Stages };
export type { StagesProps, WorkflowStage };
