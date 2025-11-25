import { Action } from '../../../domain/action';
import { SectionOptions } from './section';
/**
 * Create a new section builder with its own sections registry
 */
declare const createSectionBuilder: () => {
    /**
     * Create & add a section to the builder's registry
     * @param sectionName - The unique name of the section
     * @param options - The options used to build a {@link Section}
     */
    createSection(sectionName: string, options: SectionOptions): any;
    /**
     * Removes a section from the builder's registry using its unique name
     * @param sectionName - The name of the section to delete
     */
    deleteSection(sectionName: string): any;
    /**
     * Register a handler function for a given section
     * @param  sectionName - The name of the section
     * @param  handler - The handler to register
     */
    addHandler(sectionName: string, handler: () => unknown): any;
    /**
     * Register a matcher function for a given section
     * @param sectionName - The name of the section
     * @param matcher - The handler to register

     */
    addMatcher(sectionName: string, matcher: () => unknown): any;
    /**
     * Build a section tree based on the registered actions and the given actions
     * @param actions - The actions used to build each section
     */
    build(actions?: Action[]): Promise<any>;
};
export default createSectionBuilder;
//# sourceMappingURL=builder.d.ts.map