// The documentation navigation manifest. Each item points at a `.wit` content
// file (relative to website/content/) and the URL slug it renders to. Order
// here is the sidebar order; the canonical *teaching* order is in
// docs/content-design/onboarding-sequence.md. Grows as content is authored.

export const site = {
  title: 'Wit',
  tagline: 'Write the paper. Not the preamble.',
  repo: 'https://github.com/PurpleReverie/prototype_language_wit',
};

export const nav = [
  {
    section: 'Get Started',
    items: [
      { title: 'What is Wit?',        slug: 'start/what-is-wit',      file: 'start/what-is-wit.wit' },
      { title: 'Install',             slug: 'start/install',          file: 'start/install.wit' },
      { title: 'Your first document', slug: 'start/first-document',   file: 'start/first-document.wit' },
      { title: 'The mental model',    slug: 'start/mental-model',     file: 'start/mental-model.wit' },
      { title: 'Nodes & core vocab',  slug: 'start/nodes',            file: 'start/nodes.wit' },
      { title: 'Choose your path',    slug: 'start/choose-your-path', file: 'start/choose-your-path.wit' },
    ],
  },
  {
    section: 'Reference',
    items: [
      { title: 'Core vocabulary', slug: 'reference/core-vocabulary', file: 'reference/core-vocabulary.wit' },
    ],
  },
];
