import 'quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import ReactQuill from 'react-quill-new';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string, isEmpty: boolean) => void;
  placeholder?: string;
};

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image'],
  ['clean'],
];

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const modules = useMemo(() => ({ toolbar: TOOLBAR }), []);

  return (
    <div className="rich-text-editor overflow-hidden rounded-md border border-gray-200 bg-white [&_.ql-container]:min-h-[180px] [&_.ql-editor]:min-h-[180px]">
      <ReactQuill
        modules={modules}
        onChange={(html, _delta, _source, editor) => {
          const sanitized = DOMPurify.sanitize(html);
          const isEmpty = editor.getText().trim() === '' && !sanitized.includes('<img');
          onChange(sanitized, isEmpty);
        }}
        placeholder={placeholder}
        theme="snow"
        value={value}
      />
    </div>
  );
};

export default RichTextEditor;
