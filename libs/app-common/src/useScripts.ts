import { useEffect } from 'react';

interface Script {
  src: URL;
  integrity: string;
  module?: boolean;
}
/**
 * Hook for dynamically adding script module elements to the document. The scripts must be trusted and digest value for SRI is required.
 *
 * @export
 * @param {Script[]} scripts
 */
export function useScripts(...scripts: Script[]) {
  useEffect(() => {
    const added: HTMLScriptElement[] = [];
    for (const script of scripts.filter((script) => !!script)) {
      if (!script?.src?.href || typeof script.integrity !== 'string') {
        throw new Error('Provided script must include valid src and integrity values.');
      }

      const scriptElement = document.createElement('script');
      scriptElement.src = script.src.href;
      scriptElement.integrity = script.integrity;
      scriptElement.crossOrigin = 'anonymous';
      if (script.module) {
        scriptElement.type = 'module';
      }

      added.push(document.body.appendChild(scriptElement));
    }
    return () => {
      for (const element of added) {
        document.body.removeChild(element);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...scripts]);
}
