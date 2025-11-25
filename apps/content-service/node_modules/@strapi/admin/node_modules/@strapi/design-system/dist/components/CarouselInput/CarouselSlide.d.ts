/// <reference types="react" />
import { FlexProps } from '../../primitives/Flex';
export interface CarouselSlideProps extends FlexProps {
    children: React.ReactNode;
    label: string;
    selected?: boolean;
}
export declare const CarouselSlide: ({ label, children, selected, ...props }: CarouselSlideProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CarouselSlide.d.ts.map