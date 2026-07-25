# wit-vscode

VS Code extension for the Wit language (`.wit` files).

This package provides:

- Language registration for `.wit` files.
- TextMate grammar (syntax highlighting), including embedded highlighting
  for foreign syntax in raw `@@` nodes (see below).
- Language configuration (brackets, comments).
- LSP client + server.

## Embedded-language highlighting

Raw `@@` nodes carry foreign syntax, and the grammar highlights it inline:

| Node | Body highlighted as | Scope |
|------|--------------------|-------|
| `@@style … style@@` | CSS | `source.css` (built in) |
| `@@script … script@@`, `<% … %>` | JavaScript | `source.js` (built in) |
| `@@math … math@@`, `@@mathblock … mathblock@@` | LaTeX | `text.tex.latex` |
| `@@diagram … diagram@@` | Mermaid | `source.mermaid` |
| `@@diagram(engine graphviz) … diagram@@` | Graphviz DOT | `source.dot` |

CSS and JS work out of the box (those grammars ship with VS Code). For
**math** and **diagrams**, install a companion extension that provides the
grammar and highlighting activates automatically — e.g. *LaTeX Workshop*
(LaTeX), a *Mermaid* syntax extension, or a *Graphviz (DOT)* extension.
Without one, the body is still scoped as an embedded block (so it reads as a
distinct region) but is not tokenized. `{{…}}` interpolation stays highlighted
inside `@@` bodies regardless.

## Status

Dev-time install only. This extension is not yet published to the VS Code
Marketplace. To try it locally, build the workspace and use the VS Code
"Run Extension" launch target, or package it with `vsce package` and
install the resulting `.vsix`.

## Layout

- `client/extension.ts` — VS Code extension entry point (LSP client).
- `server/server.ts` — language server.
- `syntaxes/wit.tmLanguage.json` — TextMate grammar.
- `language-configuration.json` — language-config for editor behavior.

This scaffold (M5.scaffold) creates placeholder files only. Subsequent
M5.* tasks fill them in.
