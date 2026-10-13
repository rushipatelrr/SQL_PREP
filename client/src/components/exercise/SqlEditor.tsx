import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import { useThemeStore } from '@/stores/themeStore';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRunShortcut?: () => void;
  height?: string;
}

// Two custom Monaco themes, defined once, whose colors are lifted from the same design
// tokens as the rest of the app (src/index.css) rather than Monaco's stock vs-dark/vs —
// keeps the editor from looking like a bolted-on, differently-themed widget.
const DARK_THEME_NAME = 'sqlprep-dark';
const LIGHT_THEME_NAME = 'sqlprep-light';

const beforeMount: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(DARK_THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#151517',
      'editor.lineHighlightBackground': '#1c1c1f',
      'editorLineNumber.foreground': '#4a4a50',
      'editorCursor.foreground': '#e0a24b',
    },
  });
  monaco.editor.defineTheme(LIGHT_THEME_NAME, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.lineHighlightBackground': '#f0f2f5',
    },
  });
};

export function SqlEditor({ value, onChange, onRunShortcut, height = '220px' }: SqlEditorProps) {
  const theme = useThemeStore((s) => s.theme);

  const handleMount: OnMount = (editor, monaco) => {
    if (onRunShortcut) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRunShortcut);
    }
  };

  return (
    <div className="overflow-hidden rounded-card border border-line">
      <Editor
        height={height}
        defaultLanguage="sql"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        beforeMount={beforeMount}
        onMount={handleMount}
        theme={theme === 'dark' ? DARK_THEME_NAME : LIGHT_THEME_NAME}
        options={{
          fontFamily: "'IBM Plex Mono', Menlo, monospace",
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: 'all',
          tabSize: 2,
        }}
      />
    </div>
  );
}
