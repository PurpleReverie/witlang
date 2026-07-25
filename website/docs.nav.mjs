// The documentation navigation manifest. Each item points at a `.wit` content
// file (relative to website/content/) and the URL slug it renders to. Order
// here is the sidebar order; the canonical *teaching* order is in
// docs/content-design/onboarding-sequence.md.

import { config } from './site.config.mjs';

// Deploy-time values (repo URL, brand, tagline) come from website/.env via
// site.config.mjs, with fallbacks. Edit .env, not this file.
export const site = {
  title: config.title,
  tagline: config.tagline,
  repo: config.repo,
  url: config.siteUrl,
};

export const nav = [
  {
    section: 'Get Started',
    items: [
      { title: 'What is Wit?',                  slug: 'start/what-is-wit',  file: 'start/what-is-wit.wit' },
      { title: 'Install & your first document', slug: 'start/install',      file: 'start/install.wit' },
      { title: 'Nodes & the mental model',      slug: 'start/mental-model', file: 'start/mental-model.wit' },
    ],
  },
  {
    section: 'Write',
    items: [
      { title: 'Writing text',                   slug: 'write/prose',      file: 'write/prose.wit' },
      { title: 'Structure & layout',             slug: 'write/structure',  file: 'write/structure.wit' },
      { title: 'Tables',                         slug: 'write/tables',     file: 'write/tables.wit' },
      { title: 'Images & media',                 slug: 'write/media',      file: 'write/media.wit' },
      { title: 'Reuse: components & multi-file', slug: 'write/components', file: 'write/components.wit' },
      { title: 'Rendering & styling',            slug: 'write/rendering',  file: 'write/rendering.wit' },
    ],
  },
  {
    section: 'Build',
    items: [
      { title: 'Architecture',           slug: 'build/architecture',     file: 'build/architecture.wit' },
      { title: 'Install the packages',   slug: 'build/install',          file: 'build/install.wit' },
      { title: 'Parsing to the AST',     slug: 'build/parsing-ast',      file: 'build/parsing-ast.wit' },
      { title: 'AST reference',          slug: 'build/ast-reference',    file: 'build/ast-reference.wit' },
      { title: 'Resolve & expand',       slug: 'build/resolve-expand',   file: 'build/resolve-expand.wit' },
      { title: 'Rendering',              slug: 'build/rendering',        file: 'build/rendering.wit' },
      { title: 'External data',          slug: 'build/external-data',    file: 'build/external-data.wit' },
      { title: 'Build your own renderer', slug: 'build/custom-renderer', file: 'build/custom-renderer.wit' },
      { title: 'Embed Wit in an app',    slug: 'build/embed',            file: 'build/embed.wit' },
      { title: 'Custom nodes',           slug: 'build/custom-nodes',     file: 'build/custom-nodes.wit' },
      { title: 'Scripting & the lh bridge', slug: 'build/scripting',     file: 'build/scripting.wit' },
      { title: 'Errors reference',       slug: 'build/errors-reference', file: 'build/errors-reference.wit' },
      { title: 'CLI reference',          slug: 'build/cli-reference',    file: 'build/cli-reference.wit' },
    ],
  },
  {
    section: 'Guides',
    items: [
      { title: 'Node use & bare reference', slug: 'guides/node-use',              file: 'guides/node-use.wit' },
      { title: 'Parameters & invocation forms', slug: 'guides/parameters',        file: 'guides/parameters.wit' },
      { title: 'Defining nodes',            slug: 'guides/defining-nodes',        file: 'guides/defining-nodes.wit' },
      { title: 'Interpolation & captures',  slug: 'guides/interpolation-captures', file: 'guides/interpolation-captures.wit' },
      { title: 'Data: records, collections & access', slug: 'guides/data',        file: 'guides/data.wit' },
      { title: 'Conditionals',              slug: 'guides/conditionals',          file: 'guides/conditionals.wit' },
      { title: 'Iteration',                 slug: 'guides/iteration',             file: 'guides/iteration.wit' },
      { title: 'Additive partials',         slug: 'guides/additive-partials',     file: 'guides/additive-partials.wit' },
      { title: 'Multi-file documents',      slug: 'guides/multi-file',            file: 'guides/multi-file.wit' },
      { title: 'Composing constructs',      slug: 'guides/composing',             file: 'guides/composing.wit' },
      { title: 'Gotchas & ambiguity',       slug: 'guides/gotchas',               file: 'guides/gotchas.wit' },
      { title: 'Escapes & special chars',   slug: 'guides/escapes',               file: 'guides/escapes.wit' },
      { title: 'Literal & raw nodes; CSS',  slug: 'guides/literal-raw-css',       file: 'guides/literal-raw-css.wit' },
      { title: 'Self-organising documents', slug: 'guides/self-organising',       file: 'guides/self-organising.wit' },
      { title: 'Faceted content',           slug: 'guides/faceted',               file: 'guides/faceted.wit' },
      { title: 'Derived content',           slug: 'guides/derived-content',       file: 'guides/derived-content.wit' },
    ],
  },
  {
    section: 'Reference',
    items: [
      { title: 'Syntax',            slug: 'reference/syntax',          file: 'reference/syntax.wit' },
      { title: 'Core vocabulary',   slug: 'reference/core-vocabulary', file: 'reference/core-vocabulary.wit' },
      { title: 'CLI',               slug: 'reference/cli',             file: 'reference/cli.wit' },
      { title: 'Config',            slug: 'reference/config',          file: 'reference/config.wit' },
      { title: 'Data model',        slug: 'reference/data-model',      file: 'reference/data-model.wit' },
      { title: 'Errors',            slug: 'reference/errors',          file: 'reference/errors.wit' },
      { title: 'API',               slug: 'reference/api',             file: 'reference/api.wit' },
      { title: 'Known limitations', slug: 'reference/limitations',     file: 'reference/limitations.wit' },
      { title: 'Glossary & cross-references', slug: 'reference/glossary', file: 'reference/glossary.wit' },
      { title: 'Cheatsheet',        slug: 'reference/cheatsheet',      file: 'reference/cheatsheet.wit' },
    ],
  },
  {
    section: 'Recipes',
    items: [
      { title: 'Thesis to PDF',         slug: 'recipes/thesis',               file: 'recipes/thesis.wit' },
      { title: 'Report with live data', slug: 'recipes/report-live-data',     file: 'recipes/report-live-data.wit' },
      { title: 'CSV into a table',      slug: 'recipes/csv-table',            file: 'recipes/csv-table.wit' },
      { title: 'Manuscript in chapters', slug: 'recipes/manuscript-chapters', file: 'recipes/manuscript-chapters.wit' },
      { title: 'Creative writing',      slug: 'recipes/creative-writing',     file: 'recipes/creative-writing.wit' },
      { title: 'Interactive script',    slug: 'recipes/rpg-script',           file: 'recipes/rpg-script.wit' },
      { title: 'A website in Wit',      slug: 'recipes/website-in-wit',       file: 'recipes/website-in-wit.wit' },
      { title: 'Bibliography across files', slug: 'recipes/bibliography',     file: 'recipes/bibliography.wit' },
      { title: 'Embed the parser',      slug: 'recipes/embed-parser',         file: 'recipes/embed-parser.wit' },
      { title: 'Custom renderer',       slug: 'recipes/custom-renderer',      file: 'recipes/custom-renderer.wit' },
      { title: 'Annotated essay',       slug: 'recipes/annotated-essay',      file: 'recipes/annotated-essay.wit' },
    ],
  },
  {
    section: 'Project',
    items: [
      { title: 'Design principles',    slug: 'project/principles',   file: 'project/principles.wit' },
      { title: 'Roadmap',              slug: 'project/roadmap',       file: 'project/roadmap.wit' },
      { title: 'Extending',            slug: 'project/extending',     file: 'project/extending.wit' },
      { title: 'The spec',             slug: 'project/spec',          file: 'project/spec.wit' },
      { title: 'Changelog',            slug: 'project/changelog',     file: 'project/changelog.wit' },
    ],
  },
];
