import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { useEffect } from 'react';
import { RichTextEditorProps } from './editorTypes';

export function TiptapEditor({
  value,
  onChange,
  ariaLabel = 'HTML editor',
  minHeight = 250,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();

    if (currentHtml !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();

    if (currentHtml !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;

    editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (!url) return;

    editor.chain().focus().setImage({ src: url }).run();
  };

  const setFont = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  return (
    <div>
      <div className="toolbar">
        <select onChange={(e) => setFont(e.target.value)} defaultValue="">
          <option value="" disabled>
            Font
          </option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>

        <button onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>

        <button onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>

        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullet List</button>

        <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbered List</button>

        <button onClick={addLink}>Link</button>

        <button onClick={addImage}>Image</button>

        <button onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Clear</button>
      </div>

      <EditorContent editor={editor} className="tiptap-editor" aria-label={ariaLabel} style={{ minHeight }} />
    </div>
  );
}
