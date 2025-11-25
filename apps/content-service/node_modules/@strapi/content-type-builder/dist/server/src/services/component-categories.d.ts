type Infos = {
    name: string;
};
/**
 * Edit a category name and move components to the write folder
 */
export declare const editCategory: (name: string, infos: Infos) => Promise<string | undefined>;
/**
 * Deletes a category and its components
 */
export declare const deleteCategory: (name: string) => Promise<void>;
export {};
//# sourceMappingURL=component-categories.d.ts.map