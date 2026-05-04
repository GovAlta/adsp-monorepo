export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  ariaLabel?: string;
  minHeight?: number;
};
