import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { RichTextEditorProps } from './editorTypes';

export function QuillEditor({ value, onChange, ariaLabel = 'HTML editor', minHeight = 250 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ font: [] }],
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'image'],
          ['clean'],
        ],
      },
    });

    quill.root.innerHTML = value;

    const handleTextChange = () => {
      onChangeRef.current(quill.root.innerHTML);
    };

    quill.on('text-change', handleTextChange);

    quillRef.current = quill;

    return () => {
      quill.off('text-change', handleTextChange);
      quillRef.current = null;

      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;

    if (!quill || quill.root.innerHTML === value) return;

    quill.root.innerHTML = value;
  }, [value]);

  return (
    <div ref={editorRef} className="editor" aria-label={ariaLabel} style={{ minHeight }} />
  );
}
