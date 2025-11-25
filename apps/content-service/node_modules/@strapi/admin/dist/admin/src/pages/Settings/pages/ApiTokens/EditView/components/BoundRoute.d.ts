type HttpVerb = 'POST' | 'GET' | 'PUT' | 'DELETE';
interface BoundRouteProps {
    route: {
        handler: string;
        method: HttpVerb;
        path: string;
    };
}
export declare const BoundRoute: ({ route, }: BoundRouteProps) => import("react/jsx-runtime").JSX.Element;
export {};
