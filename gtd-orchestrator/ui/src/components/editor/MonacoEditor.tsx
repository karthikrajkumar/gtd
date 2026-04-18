import Editor from '@monaco-editor/react';

interface Props {
  content: string;
  language: string;
  path: string;
}

export function MonacoEditor({ content, language, path }: Props) {
  return (
    <Editor
      key={path}
      height="100%"
      language={language}
      value={content}
      theme="vs-dark"
      options={{
        readOnly: true,
        minimap: { enabled: true },
        fontSize: 13,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        padding: { top: 8 },
      }}
    />
  );
}
