import { createContext } from 'react';

export interface ReviewContextProps {
  onEdit: () => void;
}

export const ReviewContext = createContext<ReviewContextProps | null>(null);
