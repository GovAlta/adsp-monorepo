import { Route, Routes } from 'react-router-dom';
import { Script } from './script';
import { ScriptsView } from './scriptsView';

export const ScriptRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Script />} />
      <Route path="/edit/:id" element={<ScriptsView />} />
    </Routes>
  );
};
