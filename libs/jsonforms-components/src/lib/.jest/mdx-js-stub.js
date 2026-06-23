// No-op stub: compileSync must not throw so valid markdown passes checkMarkDownIsValid
export const compileSync = () => ({ toString: () => '' });
export default {};
