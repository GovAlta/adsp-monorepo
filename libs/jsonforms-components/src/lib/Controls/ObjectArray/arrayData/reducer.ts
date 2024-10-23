import {
  ObjectArrayActions,
  ADD_DATA_ACTION,
  SET_DATA_ACTION,
  INCREMENT_ACTION,
  DELETE_ACTION,
  RegisterDataResponse,
  Categories,
  AddData,
  RemoveData,
} from './actions';
export function objectListReducer(state: { categories: Categories }, action: ObjectArrayActions): RegisterDataResponse {
  switch (action.type) {
    case ADD_DATA_ACTION: {
      //ok so we're assuming we're already getting the updated category data
      const { categories } = state;
      const { name, category } = action.payload as AddData;
      const newCategories = Object.assign({}, categories);
      newCategories[name].data = category;
      return { ...state, categories: newCategories };
    }
    case SET_DATA_ACTION: {
      const CategoriesStateData = action.payload as Categories;
      return { ...state, categories: CategoriesStateData };
    }
    case INCREMENT_ACTION: {
      const { categories } = state;
      const name = action.payload as string;
      const newCategories = Object.assign({}, categories);
      // Assuming you want to increment the count of a category:
      if (newCategories[name]) {
        const updatedCategory = {
          ...categories[name],
          count: (categories[name].count || 0) + 1,
        };
        return { ...state, categories: { ...categories, [name]: updatedCategory } };
      } else {
        newCategories[name] = { count: 1, data: {} };
      }

      return { ...state, categories: newCategories };
    }
    case DELETE_ACTION: {
      const { name, category } = action.payload as RemoveData;
      const { categories } = state;
      const newCategories = Object.assign({}, categories);
      newCategories[name] = category;
      return { ...state, categories: newCategories };
    }
    default:
      return state;
  }
}
