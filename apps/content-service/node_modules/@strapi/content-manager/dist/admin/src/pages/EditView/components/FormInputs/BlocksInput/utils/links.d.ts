import { Editor } from 'slate';
declare const removeLink: (editor: Editor) => void;
declare const insertLink: (editor: Editor, { url }: {
    url: string;
}) => void;
declare const editLink: (editor: Editor, link: {
    url: string;
    text: string;
}) => void;
export { insertLink, editLink, removeLink };
