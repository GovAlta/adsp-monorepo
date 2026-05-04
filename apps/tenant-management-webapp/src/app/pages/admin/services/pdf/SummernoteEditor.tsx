import { useEffect, useRef } from 'react';

import $ from 'jquery';

import 'summernote/dist/summernote-lite.css';
import 'summernote/dist/summernote-lite.js';
import { RichTextEditorProps } from './editorTypes';

const summernoteJQuery = $ as typeof $ & { now?: () => number };

if (!summernoteJQuery.now) {
  summernoteJQuery.now = Date.now;
}

export function SummernoteEditor({
  value,
  onChange,
  ariaLabel = 'HTML editor',
  minHeight = 250,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!textareaRef.current) return;

    const $editor = $(textareaRef.current);

    $editor.summernote({
      height: minHeight,
      placeholder: 'Write formatted notes here...',
      toolbar: [
        ['font', ['fontname', 'fontsize']],
        ['style', ['bold', 'italic', 'underline', 'clear']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['insert', ['link', 'picture']],
        ['view', ['codeview']],
      ],
      callbacks: {
        onChange: (contents: string) => {
          onChangeRef.current(contents);
        },
      },
    });

    $editor.summernote('code', value);

    return () => {
      $editor.summernote('destroy');
    };
  }, [minHeight, value]);

  useEffect(() => {
    if (!textareaRef.current) return;

    const $editor = $(textareaRef.current);
    const currentHtml = $editor.summernote('code');

    if (currentHtml !== value) {
      $editor.summernote('code', value);
    }
  }, [value]);

  return (
    <textarea ref={textareaRef} aria-label={ariaLabel} />
  );
}
