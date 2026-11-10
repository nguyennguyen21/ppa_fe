import { useEffect, useRef } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
  rectangularSelection,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  highlightSelectionMatches,
  search,
  searchKeymap,
} from "@codemirror/search";
import {
  HighlightStyle,
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { tags } from "@lezer/highlight";
import { useTheme } from "../../lib/hook/theme-context";
import type { CodeLanguage } from "../utils/aiClassify";

export type LineTone = "ai" | "human" | "neutral";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: CodeLanguage;
  lineTones?: LineTone[];
  onLineClick?: (line: number) => void;
  autoFocus?: boolean;
  ariaLabel?: string;
}

const lineTone = (tone: LineTone) =>
  Decoration.line({ class: tone === "ai" ? "cm-tone-ai" : "cm-tone-human" });

const toneExtension = (tones: LineTone[]): Extension =>
  EditorView.decorations.of((view) => {
    const ranges = [];
    const total = Math.min(tones.length, view.state.doc.lines);
    for (let index = 0; index < total; index += 1) {
      const tone = tones[index];
      if (!tone || tone === "neutral") continue;
      ranges.push(lineTone(tone).range(view.state.doc.line(index + 1).from));
    }
    return Decoration.set(ranges, true);
  });

const languageExtension = (language: CodeLanguage): Extension => {
  switch (language) {
    case "c":
    case "cpp":
      return cpp();
    case "java":
      return java();
    case "python":
      return python();
    case "javascript":
    case "typescript":
      return javascript({ jsx: true, typescript: true });
    default:
      return [];
  }
};

const baseTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "12.5px" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    lineHeight: "1.75",
    overflow: "auto",
  },
  ".cm-content": { padding: "10px 0" },
  ".cm-line": { padding: "0 12px" },
  ".cm-gutters": { border: "none", paddingLeft: "4px" },
  "&.cm-focused": { outline: "none" },
});

const lightTheme = EditorView.theme(
  {
    "&": { color: "#292524", backgroundColor: "#fbfbfa" },
    ".cm-content": { caretColor: "#1c1917" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#1c1917" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: "#dbe7f1" },
    ".cm-panels": { backgroundColor: "#f5f5f4", color: "#292524" },
    ".cm-activeLine": { backgroundColor: "rgba(28,25,23,0.04)" },
    ".cm-gutters": { backgroundColor: "#f5f5f4", color: "#8c8681" },
    ".cm-activeLineGutter": { backgroundColor: "#e7e5e4", color: "#292524" },
    ".cm-foldPlaceholder": { backgroundColor: "#e7e5e4", border: "none", color: "#57534e" },
    ".cm-tooltip": { border: "1px solid #d6d3d1", backgroundColor: "#ffffff", color: "#292524" },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: "#e7e5e4",
      color: "#1c1917",
    },
    ".cm-searchMatch": { backgroundColor: "rgba(245,158,11,0.24)" },
    ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: "rgba(245,158,11,0.46)" },
  },
  { dark: false },
);

const lightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#9f1239" },
  { tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: "#1c1917" },
  { tag: [tags.function(tags.variableName), tags.labelName], color: "#1d4ed8" },
  { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: "#b45309" },
  { tag: [tags.definition(tags.name), tags.separator], color: "#0f766e" },
  { tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: "#7c3aed" },
  { tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link], color: "#0e7490" },
  { tag: [tags.meta, tags.comment], color: "#78716c", fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.link, color: "#1d4ed8", textDecoration: "underline" },
  { tag: tags.heading, fontWeight: "700" },
  { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: "#b45309" },
  { tag: [tags.processingInstruction, tags.string, tags.inserted], color: "#15803d" },
  { tag: tags.invalid, color: "#dc2626" },
]);

const themeExtension = (dark: boolean): Extension =>
  dark ? oneDark : [lightTheme, syntaxHighlighting(lightHighlight)];

export default function CodeEditor({
  value,
  onChange,
  language,
  lineTones = [],
  onLineClick,
  autoFocus = false,
  ariaLabel = "Mã nguồn cần phân loại",
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onLineClickRef = useRef(onLineClick);
  const valueRef = useRef(value);
  const languageRef = useRef(language);
  const tonesRef = useRef(lineTones);
  const { isDark } = useTheme();
  const isDarkRef = useRef(isDark);
  const languageCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const toneCompartment = useRef(new Compartment());

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onLineClickRef.current = onLineClick;
  }, [onLineClick]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: valueRef.current,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          history(),
          foldGutter(),
          drawSelection(),
          dropCursor(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          search({ top: true }),
          rectangularSelection(),
          crosshairCursor(),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            indentWithTab,
          ]),
          languageCompartment.current.of(languageExtension(languageRef.current)),
          themeCompartment.current.of(themeExtension(isDarkRef.current)),
          toneCompartment.current.of(toneExtension(tonesRef.current)),
          baseTheme,
          placeholderExtension("Dán mã nguồn vào đây hoặc dùng nút “Nạp file” / chọn một mẫu bên trên…"),
          EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const next = update.state.doc.toString();
            valueRef.current = next;
            onChangeRef.current(next);
          }),
          EditorView.domEventHandlers({
            mousedown: (event, currentView) => {
              if (!onLineClickRef.current) return false;
              const position = currentView.posAtCoords({ x: event.clientX, y: event.clientY });
              if (position === null) return false;
              onLineClickRef.current(currentView.state.doc.lineAt(position).number);
              return false;
            },
          }),
        ],
      }),
      parent: host,
    });

    viewRef.current = view;
    if (autoFocus) view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Editor chỉ khởi tạo một lần; các thay đổi được đồng bộ qua các effect bên dưới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    valueRef.current = value;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  useEffect(() => {
    languageRef.current = language;
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: languageCompartment.current.reconfigure(languageExtension(language)),
    });
  }, [language]);

  useEffect(() => {
    tonesRef.current = lineTones;
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: toneCompartment.current.reconfigure(toneExtension(lineTones)),
    });
  }, [lineTones]);

  useEffect(() => {
    isDarkRef.current = isDark;
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeCompartment.current.reconfigure(themeExtension(isDark)),
    });
  }, [isDark]);

  return <div ref={hostRef} className="h-full w-full overflow-hidden" />;
}
