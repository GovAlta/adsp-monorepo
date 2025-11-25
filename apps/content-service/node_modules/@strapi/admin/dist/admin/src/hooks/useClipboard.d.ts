declare const useClipboard: () => {
    copy: (value: string | number) => Promise<boolean>;
};
export { useClipboard };
