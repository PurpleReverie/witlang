// AsciiMath → MathML renderer (zero-dependency).
//
// A raw `@@math … math@@` (inline) or `@@mathblock … mathblock@@` (display)
// node carries verbatim AsciiMath; this turns it into Presentation MathML,
// which modern browsers and the PDF path (headless Chromium) render natively.
//
// Grammar (Jipsen's AsciiMath, common subset):
//   S ::= const | left E right | unary S | binary S S | "text"
//   I ::= S_S | S^S | S_S^S | S
//   E ::= I E | I / I
//
// `renderMath` dispatches on an engine name so more engines (e.g. LaTeX) can
// be added later without changing call sites. AsciiMath is the default.

type EngineName = string;
type Engine = (src: string, display: boolean) => string;

const ENGINES: Record<EngineName, Engine> = {
  asciimath: asciiMathToMathML,
};

export function renderMath(
  src: string, opts: { display?: boolean; engine?: EngineName } = {},
): string {
  const engine = ENGINES[(opts.engine ?? 'asciimath').toLowerCase()];
  if (engine === undefined) {
    // Unknown engine: fall back to AsciiMath rather than dropping the math.
    return asciiMathToMathML(src, opts.display === true);
  }
  return engine(src, opts.display === true);
}

// ---------------------------------------------------------------------------
// Symbol table. Each entry: [kind, output]. Numbers, single letters, quoted
// text, and the operators `_ ^ /` are handled by the tokenizer, not here.
// ---------------------------------------------------------------------------

type Kind = 'mo' | 'mi' | 'fn' | 'unary' | 'binary' | 'left' | 'right';

const SYMBOLS: Record<string, [Kind, string]> = {
  // Binary operators / arithmetic.
  '+': ['mo', '+'], '-': ['mo', '−'], '*': ['mo', '⋅'],
  '**': ['mo', '⋆'], '//': ['mo', '/'], 'xx': ['mo', '×'],
  '-:': ['mo', '÷'], 'o+': ['mo', '⊕'], 'ox': ['mo', '⊗'],
  '+-': ['mo', '±'], 'cdot': ['mo', '⋅'],
  // Big operators.
  'sum': ['mo', '∑'], 'prod': ['mo', '∏'], 'int': ['mo', '∫'],
  'oint': ['mo', '∮'], 'del': ['mo', '∂'], 'partial': ['mo', '∂'],
  'nabla': ['mo', '∇'], 'grad': ['mo', '∇'],
  // Relations.
  '=': ['mo', '='], '!=': ['mo', '≠'], 'ne': ['mo', '≠'],
  '<': ['mo', '<'], '>': ['mo', '>'], '<=': ['mo', '≤'], 'le': ['mo', '≤'],
  '>=': ['mo', '≥'], 'ge': ['mo', '≥'], '-=': ['mo', '≡'],
  'equiv': ['mo', '≡'], '~=': ['mo', '≅'], '~~': ['mo', '≈'],
  'approx': ['mo', '≈'], 'prop': ['mo', '∝'], 'in': ['mo', '∈'],
  '!in': ['mo', '∉'], 'sub': ['mo', '⊂'], 'sup': ['mo', '⊃'],
  'sube': ['mo', '⊆'], 'supe': ['mo', '⊇'],
  // Logic / sets.
  'and': ['mo', '∧'], 'or': ['mo', '∨'], 'not': ['mo', '¬'],
  'nn': ['mo', '∩'], 'uu': ['mo', '∪'], 'oo': ['mo', '∞'],
  // Arrows.
  '->': ['mo', '→'], 'to': ['mo', '→'], '|->': ['mo', '↦'],
  'mapsto': ['mo', '↦'], '<-': ['mo', '←'], '=>': ['mo', '⇒'],
  'implies': ['mo', '⇒'], '<=>': ['mo', '⇔'], 'iff': ['mo', '⇔'],
  // Dots.
  '...': ['mo', '…'], 'ldots': ['mo', '…'], 'cdots': ['mo', '⋯'],
  // Greek (lower).
  'alpha': ['mi', 'α'], 'beta': ['mi', 'β'], 'gamma': ['mi', 'γ'],
  'delta': ['mi', 'δ'], 'epsilon': ['mi', 'ε'], 'zeta': ['mi', 'ζ'],
  'eta': ['mi', 'η'], 'theta': ['mi', 'θ'], 'iota': ['mi', 'ι'],
  'kappa': ['mi', 'κ'], 'lambda': ['mi', 'λ'], 'mu': ['mi', 'μ'],
  'nu': ['mi', 'ν'], 'xi': ['mi', 'ξ'], 'pi': ['mi', 'π'],
  'rho': ['mi', 'ρ'], 'sigma': ['mi', 'σ'], 'tau': ['mi', 'τ'],
  'phi': ['mi', 'φ'], 'chi': ['mi', 'χ'], 'psi': ['mi', 'ψ'],
  'omega': ['mi', 'ω'],
  // Greek (upper).
  'Gamma': ['mi', 'Γ'], 'Delta': ['mi', 'Δ'], 'Theta': ['mi', 'Θ'],
  'Lambda': ['mi', 'Λ'], 'Xi': ['mi', 'Ξ'], 'Pi': ['mi', 'Π'],
  'Sigma': ['mi', 'Σ'], 'Phi': ['mi', 'Φ'], 'Psi': ['mi', 'Ψ'],
  'Omega': ['mi', 'Ω'],
  // Named functions (upright identifiers).
  'sin': ['fn', 'sin'], 'cos': ['fn', 'cos'], 'tan': ['fn', 'tan'],
  'sec': ['fn', 'sec'], 'csc': ['fn', 'csc'], 'cot': ['fn', 'cot'],
  'log': ['fn', 'log'], 'ln': ['fn', 'ln'], 'exp': ['fn', 'exp'],
  'det': ['fn', 'det'], 'dim': ['fn', 'dim'], 'lim': ['fn', 'lim'],
  'max': ['fn', 'max'], 'min': ['fn', 'min'], 'gcd': ['fn', 'gcd'],
  // Unary constructors.
  'sqrt': ['unary', 'sqrt'], 'abs': ['unary', 'abs'], 'hat': ['unary', 'hat'],
  'bar': ['unary', 'bar'], 'vec': ['unary', 'vec'], 'ul': ['unary', 'ul'],
  'dot': ['unary', 'dot'],
  // Binary constructors.
  'frac': ['binary', 'frac'], 'root': ['binary', 'root'],
  // Brackets.
  '(': ['left', '('], '[': ['left', '['], '{': ['left', '{'], '(:': ['left', '⟨'],
  ')': ['right', ')'], ']': ['right', ']'], '}': ['right', '}'], ':)': ['right', '⟩'],
};

const KEYS = Object.keys(SYMBOLS).sort((a, b) => b.length - a.length);

// ---------------------------------------------------------------------------
// Tokenizer.
// ---------------------------------------------------------------------------

interface Tok { type: string; out: string }

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src.charAt(i);
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i += 1; continue; }
    if (c === '"') {
      const end = src.indexOf('"', i + 1);
      const stop = end === -1 ? src.length : end;
      toks.push({ type: 'text', out: src.slice(i + 1, stop) });
      i = stop + 1;
      continue;
    }
    const key = KEYS.find((k) => src.startsWith(k, i));
    if (key !== undefined) {
      const [kind, out] = SYMBOLS[key]!;
      toks.push({ type: kind, out });
      i += key.length;
      continue;
    }
    if (c === '_') { toks.push({ type: 'sub', out: '_' }); i += 1; continue; }
    if (c === '^') { toks.push({ type: 'sup', out: '^' }); i += 1; continue; }
    if (c === '/') { toks.push({ type: 'frac', out: '/' }); i += 1; continue; }
    if (c >= '0' && c <= '9') {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src.charAt(j))) j += 1;
      toks.push({ type: 'num', out: src.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z]/.test(c)) { toks.push({ type: 'mi', out: c }); i += 1; continue; }
    toks.push({ type: 'mo', out: c });
    i += 1;
  }
  return toks;
}

// ---------------------------------------------------------------------------
// Recursive-descent parser → MathML.
// ---------------------------------------------------------------------------

function asciiMathToMathML(src: string, display: boolean): string {
  const p = new Parser(tokenize(src));
  const body = p.expr();
  const attr = display ? ' display="block"' : '';
  return `<math${attr}>${body}</math>`;
}

interface Node { mml: string; bare: string }

class Parser {
  private toks: Tok[];
  private pos = 0;
  constructor(toks: Tok[]) { this.toks = toks; }

  private peek(): Tok | undefined { return this.toks[this.pos]; }

  // S — a simple expression.
  simple(): Node {
    const t = this.peek();
    if (t === undefined || t.type === 'right') return { mml: '', bare: '' };
    if (t.type === 'left') return this.group(t);
    this.pos += 1;
    if (t.type === 'unary') return same(unary(t.out, this.simple().bare));
    if (t.type === 'binary') {
      return same(binary(t.out, this.simple().bare, this.simple().bare));
    }
    if (t.type === 'text') return same(`<mtext>${esc(t.out)}</mtext>`);
    if (t.type === 'num') return same(`<mn>${esc(t.out)}</mn>`);
    if (t.type === 'mi' || t.type === 'fn') return same(`<mi>${esc(t.out)}</mi>`);
    return same(`<mo>${esc(t.out)}</mo>`);
  }

  private group(open: Tok): Node {
    this.pos += 1;
    const inner = this.expr();
    let close = '';
    if (this.peek()?.type === 'right') close = esc(this.toks[this.pos++]!.out);
    const fences =
      `<mrow><mo>${esc(open.out)}</mo>${inner}${close ? `<mo>${close}</mo>` : ''}</mrow>`;
    return { mml: fences, bare: inner === '' ? '<mrow></mrow>' : inner };
  }

  // I — a simple expression with optional sub/superscript.
  inter(): Node {
    const s = this.simple();
    if (this.peek()?.type === 'sub') {
      this.pos += 1;
      const sub = this.simple().bare;
      if (this.peek()?.type === 'sup') {
        this.pos += 1;
        return same(`<msubsup>${s.mml}${sub}${this.simple().bare}</msubsup>`);
      }
      return same(`<msub>${s.mml}${sub}</msub>`);
    }
    if (this.peek()?.type === 'sup') {
      this.pos += 1;
      return same(`<msup>${s.mml}${this.simple().bare}</msup>`);
    }
    return s;
  }

  // E — a sequence of intermediates, with `/` forming fractions.
  expr(): string {
    const parts: string[] = [];
    while (this.pos < this.toks.length && this.peek()!.type !== 'right') {
      const left = this.inter();
      if (this.peek()?.type === 'frac') {
        this.pos += 1;
        parts.push(`<mfrac>${left.bare}${this.inter().bare}</mfrac>`);
      } else {
        parts.push(left.mml);
      }
    }
    return parts.length === 1 ? parts[0]! : `<mrow>${parts.join('')}</mrow>`;
  }
}

function same(mml: string): Node { return { mml, bare: mml }; }

function unary(name: string, a: string): string {
  if (name === 'sqrt') return `<msqrt>${a}</msqrt>`;
  if (name === 'abs') return `<mrow><mo>|</mo>${a}<mo>|</mo></mrow>`;
  if (name === 'ul') return `<munder>${a}<mo>―</mo></munder>`;
  const accent: Record<string, string> = {
    hat: '^', bar: '‾', vec: '→', dot: '˙',
  };
  if (name in accent) {
    return `<mover accent="true">${a}<mo>${esc(accent[name]!)}</mo></mover>`;
  }
  return a;
}

function binary(name: string, a: string, b: string): string {
  if (name === 'frac') return `<mfrac>${a}${b}</mfrac>`;
  if (name === 'root') return `<mroot>${b}${a}</mroot>`;
  return `<mrow>${a}${b}</mrow>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
