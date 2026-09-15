import { Extension } from "@tiptap/core";

export const CODE_LANGUAGES = [
  { value: "", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "markdown", label: "Markdown" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
] as const;

export const CodeBlockLanguage = Extension.create({
  name: "codeBlockLanguage",

  addOptions() {
    return {
      defaultLanguage: "",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ["codeBlock"],
        attributes: {
          language: {
            default: this.options.defaultLanguage,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute("data-language") || "",
            renderHTML: (attributes: Record<string, string>) => {
              if (!attributes.language) return {};
              return { "data-language": attributes.language };
            },
          },
        },
      },
    ];
  },

  addKeyboardShortcuts() {
    return {};
  },
});
