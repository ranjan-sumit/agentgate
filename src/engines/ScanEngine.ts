// ScanEngine — client-side simulated content-safety scan engine.
// Heuristic matcher over demo dictionaries: injection phrases, harm terms,
// PII regexes, ungrounded claims. Produces Azure-Foundry-style response JSON.

export type Severity = 0 | 2 | 4 | 6; // Safe / Low / Medium / High
export type Verdict = "PASS" | "FLAG" | "MASK" | "BLOCK";

export interface CategoryResult {
  name: "hate" | "violence" | "sexual" | "selfHarm";
  severity: Severity;
  confidence: number;
}

export interface PromptShieldResult {
  attackDetected: boolean;
  type?: "direct" | "indirect";
  subtype?: "rule-change" | "dan" | "base64" | "xpia" | "encoding" | "role-play";
  confidence: number;
}

export interface PiiFinding {
  type: "email" | "phone" | "ssn" | "creditCard" | "ipAddress";
  span: string;
  masked: string;
  start: number;
  end: number;
}

export interface ScanResult {
  verdict: Verdict;
  categories: CategoryResult[];
  promptShield: PromptShieldResult;
  pii: PiiFinding[];
  groundedness?: { ungrounded: boolean; confidence: number };
  matchedBlocklist: string[];
  latencyMs: number;
  policyVersion: string;
  scannedAt: string;
}

const INJECTION_PATTERNS: Array<{ re: RegExp; subtype: PromptShieldResult["subtype"]; confidence: number }> = [
  { re: /ignore (all |your |the )?(previous|prior|above) (instructions|rules|prompts)/i, subtype: "rule-change", confidence: 0.97 },
  { re: /reveal|show|print|repeat|leak .{0,30}(system prompt|instructions|initial prompt)/i, subtype: "rule-change", confidence: 0.93 },
  { re: /\bDAN\b|do anything now|jailbreak/i, subtype: "dan", confidence: 0.95 },
  { re: /you are now|act as|pretend (to be|you are)|role.?play as/i, subtype: "role-play", confidence: 0.78 },
  { re: /[A-Za-z0-9+/]{120,}={0,2}/, subtype: "base64", confidence: 0.88 },
  { re: /system\s*:/i, subtype: "rule-change", confidence: 0.71 },
  { re: /\u202e|base64|rot13|hex encode/i, subtype: "encoding", confidence: 0.82 },
];

const HARM_TERMS: Record<CategoryResult["name"], RegExp[]> = {
  hate: [/racial slur|ethnic cleansing|hate crime|inferior race/i],
  violence: [/how to (make|build) a (bomb|weapon|explosive)|kill (them|him|her|someone)|assassinat|molotov/i],
  sexual: [/explicit sexual|csam|non-?consensual intimate/i],
  selfHarm: [/how to (kill|harm) myself|suicide method|self-?harm (instructions|how)/i],
};

const PII_PATTERNS: Array<{ type: PiiFinding["type"]; re: RegExp; mask: (m: string) => string }> = [
  { type: "email", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, mask: (m) => m.replace(/^(.{1,2}).*(@.*)$/, "$1***$2") },
  { type: "ssn", re: /\b\d{3}-\d{2}-\d{4}\b/g, mask: () => "***-**-****" },
  { type: "creditCard", re: /\b(?:\d[ -]?){13,16}\b/g, mask: () => "**** **** **** ****" },
  { type: "phone", re: /\b(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, mask: () => "(***) ***-****" },
  { type: "ipAddress", re: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, mask: () => "x.x.x.x" },
];

const UNGROUNDED_MARKERS = [/studies show|97% of|everyone knows|it is a proven fact that/i];

export interface ScanOptions {
  channel?: "input" | "output" | "document";
  policyVersion?: string;
  blocklist?: string[];
  maskPii?: boolean;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function runScan(text: string, opts: ScanOptions = {}): ScanResult {
  const policyVersion = opts.policyVersion ?? "prod-default v14";
  const blocklist = opts.blocklist ?? ["project-nightingale", "competitor-name", "internal-codename"];

  // Prompt shield
  let shield: PromptShieldResult = { attackDetected: false, confidence: 0.99 };
  for (const p of INJECTION_PATTERNS) {
    if (p.re.test(text)) {
      shield = {
        attackDetected: true,
        type: /document|http|url|transcript/i.test(opts.channel ?? "") ? "indirect" : "direct",
        subtype: p.subtype,
        confidence: Math.min(0.99, p.confidence + rand(-0.02, 0.02)),
      };
      break;
    }
  }

  // Harm categories
  const categories: CategoryResult[] = (Object.keys(HARM_TERMS) as CategoryResult["name"][]).map((name) => {
    const hit = HARM_TERMS[name].some((re) => re.test(text));
    const severity: Severity = hit ? 6 : 0;
    return {
      name,
      severity,
      confidence: hit ? +rand(0.9, 0.99).toFixed(2) : +rand(0.97, 0.999).toFixed(3),
    };
  });

  // PII
  const pii: PiiFinding[] = [];
  for (const p of PII_PATTERNS) {
    const re = new RegExp(p.re.source, p.re.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      pii.push({ type: p.type, span: m[0], masked: p.mask(m[0]), start: m.index, end: m.index + m[0].length });
    }
  }

  // Groundedness
  const ungrounded = UNGROUNDED_MARKERS.some((re) => re.test(text));
  const groundedness =
    opts.channel === "output"
      ? { ungrounded, confidence: +rand(0.75, 0.95).toFixed(2) }
      : undefined;

  const matchedBlocklist = blocklist.filter((t) => text.toLowerCase().includes(t.toLowerCase()));

  // Verdict
  let verdict: Verdict = "PASS";
  if (categories.some((c) => c.severity >= 4) || shield.attackDetected) verdict = "BLOCK";
  else if (matchedBlocklist.length > 0 || ungrounded) verdict = "FLAG";
  else if (pii.length > 0) verdict = opts.maskPii === false ? "FLAG" : "MASK";

  return {
    verdict,
    categories,
    promptShield: shield,
    pii,
    groundedness,
    matchedBlocklist,
    latencyMs: Math.round(rand(35, 240)),
    policyVersion,
    scannedAt: new Date().toISOString(),
  };
}

// Async wrapper that mimics network latency — resolves after ~the reported latency.
export function scanAsync(text: string, opts: ScanOptions = {}): Promise<ScanResult> {
  const result = runScan(text, opts);
  return new Promise((resolve) => setTimeout(() => resolve(result), Math.min(result.latencyMs, 600)));
}

export function maskText(text: string, pii: PiiFinding[]): string {
  let out = "";
  let cursor = 0;
  for (const f of [...pii].sort((a, b) => a.start - b.start)) {
    out += text.slice(cursor, f.start) + f.masked;
    cursor = f.end;
  }
  return out + text.slice(cursor);
}
