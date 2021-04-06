import { createContext } from "react";

interface HeaderContext {
  setTitle: (title: string) => void;
}
export const HeaderCtx = createContext<HeaderContext>(null);
