import { CategoriesState, CategoryState } from '../context';

interface SectionMap {
  sectionTitle: string;
  categories: CategoryState[];
}

export const getCategorySections = (categories: CategoriesState): SectionMap[] => {
  const sectionMap = new Map<string, CategoryState[]>();

  categories.forEach((category: CategoryState) => {
    const section = category.uischema?.options?.sectionTitle || '';
    if (!sectionMap.has(section)) {
      sectionMap.set(section, []);
    }
    sectionMap.get(section)!.push(category);
  });

  return Array.from(sectionMap.entries()).map(([sectionTitle, categories]) => ({
    sectionTitle,
    categories,
  }));
};
