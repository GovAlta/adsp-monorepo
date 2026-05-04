import React, { FunctionComponent, useState } from 'react';

import { QuillEditor } from './QuillEditor';
import { TiptapEditor } from './TiptapEditor';
import { SummernoteEditor } from './SummernoteEditor';
import { GoabButton, GoabButtonGroup } from '@abgov/react-components';
import './HtmlEditor.css';

type EditorType = 'quill' | 'tiptap' | 'summernote';
const editors: Record<EditorType, { label: string }> = {
  quill: { label: 'Quill' },
  tiptap: { label: 'Tiptap' },
  summernote: { label: 'Summernote' },
};

export const HtmlEditor: FunctionComponent = () => {
  const [editorType, setEditorType] = useState<EditorType>('quill');
  const [html, setHtml] = useState('<p>Hello <strong>WYSIWYG</strong> editor!</p>');
  const currentEditorLabel = editors[editorType].label;
  const editorAriaLabel = `${currentEditorLabel} editor`;

  return (
    <main className="page">
      <h1>HTML WYSIWYG Editor POC</h1>

      <GoabButtonGroup alignment="start">
        <GoabButton onClick={() => setEditorType('quill')}>Quill</GoabButton>
        <GoabButton onClick={() => setEditorType('tiptap')}>Tiptap</GoabButton>
        <GoabButton onClick={() => setEditorType('summernote')}>Summernote</GoabButton>
      </GoabButtonGroup>

      <section className="card">
        <h2>{currentEditorLabel} Editor</h2>

        <div key={editorType}>
          {editorType === 'quill' && <QuillEditor value={html} onChange={setHtml} ariaLabel={editorAriaLabel} />}

          {editorType === 'tiptap' && <TiptapEditor value={html} onChange={setHtml} ariaLabel={editorAriaLabel} />}

          {editorType === 'summernote' && <SummernoteEditor value={html} onChange={setHtml} ariaLabel={editorAriaLabel} />}
        </div>
      </section>

      <section className="card">
        <h2>HTML Output</h2>
        <textarea value={html} readOnly rows={10} />
      </section>
    </main>
  );
};
