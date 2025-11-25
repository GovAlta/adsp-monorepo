import type { State } from '../Context';
/**
 * Migrates tours added or removed from the tours object
 */
declare const migrateTours: (storedTourState: State) => State;
export { migrateTours };
