export type PrivacyEntityType =
  | 'id_card'
  | 'bank_card'
  | 'phone'
  | 'email'
  | 'amount'
  | 'person'
  | 'organization'
  | 'address'
  | 'project'
  | 'custom';

export interface PrivacyCandidate {
  id: string;
  type: PrivacyEntityType;
  value: string;
  start: number;
  end: number;
  source: 'automatic' | 'manual' | 'dictionary';
  enabled: boolean;
}

export interface PrivacyMapping {
  placeholder: string;
  value: string;
  type: PrivacyEntityType;
  occurrences: number;
  trimAddedSpaceBefore: boolean;
  trimAddedSpaceAfter: boolean;
}

export interface PrivacyMaskResult {
  maskedText: string;
  mappings: PrivacyMapping[];
}

export const PRIVACY_TYPE_LABELS: Record<PrivacyEntityType, string> = {
  id_card: '身份证号',
  bank_card: '银行卡号',
  phone: '电话号码',
  email: '邮箱',
  amount: '金额',
  person: '姓名',
  organization: '机构名称',
  address: '地址',
  project: '项目名称',
  custom: '自定义',
};

const PATTERNS: Array<{ type: PrivacyEntityType; expression: RegExp; validate?: (value: string) => boolean }> = [
  { type: 'id_card', expression: /(?<![0-9A-Za-z])(?:\d{17}[0-9Xx]|\d{15})(?![0-9A-Za-z])/g },
  { type: 'email', expression: /(?<![\w.+-])[\w.+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?![\w.-])/g },
  { type: 'phone', expression: /(?<!\d)(?:(?:\+?86[-\s]?)?1[3-9]\d{9}|0\d{2,3}[-\s]?\d{7,8})(?!\d)/g },
  {
    type: 'bank_card',
    expression: /(?<!\d)(?:\d[ -]?){15,18}\d(?!\d)/g,
    validate: (value) => {
      const digits = value.replace(/\D/g, '');
      if (digits.length < 16 || digits.length > 19) return false;
      let sum = 0;
      let doubleDigit = false;
      for (let index = digits.length - 1; index >= 0; index -= 1) {
        let digit = Number(digits[index]);
        if (doubleDigit) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        doubleDigit = !doubleDigit;
      }
      return sum % 10 === 0;
    },
  },
  {
    type: 'amount',
    expression: /(?<![\w\d])(?:人民币\s*)?[¥￥]\s*\d+(?:,\d{3})*(?:\.\d+)?|(?<![\w\d])\d+(?:,\d{3})*(?:\.\d+)?\s*(?:万|亿)?元(?![\w])/g,
  },
];

const overlaps = (left: Pick<PrivacyCandidate, 'start' | 'end'>, right: Pick<PrivacyCandidate, 'start' | 'end'>) =>
  left.start < right.end && right.start < left.end;

interface ContextPattern {
  type: PrivacyEntityType;
  expression: RegExp;
  group: number;
  normalize?: (value: string) => { value: string; offset: number };
}

const trimOrganizationPrefix = (value: string) => {
  const cleaned = value.replace(
    /^(?:(?:今天|目前|现已)?(?:我们|我方|本方|贵方)|请[\u4e00-\u9fa5·]{2,6}?)(?:已|将|正|现)?(?:与|向|由|联系|通知|协同|联合)/,
    '',
  );
  return { value: cleaned, offset: value.length - cleaned.length };
};

const CONTEXT_PATTERNS: ContextPattern[] = [
  {
    type: 'person',
    expression: /(?:联系人|客户姓名|负责人|收件人|申请人|法定代表人|法人|经办人|员工姓名|姓名)[：:\s为是]*([\u4e00-\u9fa5·]{2,4})(?=$|[\s，。；、,;：:\n]|先生|女士|反馈|表示|确认|负责|联系|已|将)/g,
    group: 1,
  },
  {
    type: 'person',
    expression: /(?:联系|通知)([\u4e00-\u9fa5·]{2,4})(?=先生|女士|确认|反馈|参加|处理|负责|回复|到场|已|将)/g,
    group: 1,
  },
  {
    type: 'person',
    expression: /(?<![\u4e00-\u9fa5·])([\u4e00-\u9fa5·]{2,4})(?:先生|女士)/g,
    group: 1,
    normalize: (value) => (
      value.startsWith('请') && value.length > 2
        ? { value: value.slice(1), offset: 1 }
        : { value, offset: 0 }
    ),
  },
  {
    type: 'person',
    expression: /(?:请|由|与|联系|通知)([\u4e00-\u9fa5·]{2,4})(?:先生|女士)/g,
    group: 1,
  },
  {
    type: 'organization',
    expression: /(?:^|[\s，。；：、,;:\n（(])([\u4e00-\u9fa5A-Za-z0-9·（）()]{2,30}(?:有限责任公司|股份有限公司|有限公司|集团公司|集团|研究院|研究所|大学|学院|医院|银行|委员会|事务所|实验室))(?=$|[\s，。；、,;：:\n）)]|已|将|反馈|确认|负责|提供|完成)/g,
    group: 1,
    normalize: trimOrganizationPrefix,
  },
  {
    type: 'organization',
    expression: /(?:与|向|由|联系|通知|协同|联合)([\u4e00-\u9fa5A-Za-z0-9·（）()]{2,30}(?:有限责任公司|股份有限公司|有限公司|集团公司|集团|研究院|研究所|大学|学院|医院|银行|委员会|事务所|实验室))/g,
    group: 1,
  },
  {
    type: 'organization',
    expression: /(?:甲方|乙方|客户|合作方|供应商|单位|机构|公司)(?:名称)?[：:\s为是]*([\u4e00-\u9fa5A-Za-z0-9·（）()]{2,30}(?:有限责任公司|股份有限公司|有限公司|集团公司|集团|研究院|研究所|大学|学院|医院|银行|委员会|事务所|实验室))/g,
    group: 1,
  },
  {
    type: 'address',
    expression: /(?:收货地址|办公地址|联系地址|注册地址|地址|住址)(?:[：:]\s*|\s+)([^，。；;\n]{6,80})/g,
    group: 1,
  },
  {
    type: 'project',
    expression: /[“"《]([^”"》\n]{2,30})[”"》](?:项目|计划|工程)/g,
    group: 1,
  },
  {
    type: 'project',
    expression: /(?:项目|计划|工程)(?:(?:名称)?[：:]\s*|名称\s+|\s+)([\u4e00-\u9fa5A-Za-z0-9·_-]{2,30})(?=$|[\s，。；、,;：:\n])/g,
    group: 1,
  },
];

const normalizeCandidates = (candidates: PrivacyCandidate[]) => {
  const accepted: PrivacyCandidate[] = [];
  const sorted = [...candidates].sort((left, right) => (
    left.start - right.start || right.end - right.start - (left.end - left.start)
  ));
  sorted.forEach((candidate) => {
    if (!accepted.some((item) => overlaps(item, candidate))) accepted.push(candidate);
  });
  return accepted.sort((left, right) => left.start - right.start);
};

export const detectSensitiveText = (text: string, dictionary: string[] = []): PrivacyCandidate[] => {
  const candidates: PrivacyCandidate[] = [];
  PATTERNS.forEach(({ type, expression, validate }) => {
    expression.lastIndex = 0;
    for (const match of text.matchAll(expression)) {
      if (match.index === undefined || (validate && !validate(match[0]))) continue;
      candidates.push({
        id: `${type}-${match.index}-${match.index + match[0].length}`,
        type,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        source: 'automatic',
        enabled: true,
      });
    }
  });
  CONTEXT_PATTERNS.forEach(({ type, expression, group, normalize }) => {
    expression.lastIndex = 0;
    for (const match of text.matchAll(expression)) {
      if (match.index === undefined || !match[group]) continue;
      const normalized = normalize
        ? normalize(match[group])
        : { value: match[group], offset: 0 };
      if (!normalized.value) continue;
      const relativeStart = match[0].indexOf(match[group]) + normalized.offset;
      if (relativeStart < 0) continue;
      const start = match.index + relativeStart;
      candidates.push({
        id: `${type}-${start}-${start + normalized.value.length}`,
        type,
        value: normalized.value,
        start,
        end: start + normalized.value.length,
        source: 'automatic',
        enabled: true,
      });
    }
  });
  dictionary.forEach((rawValue) => {
    const value = rawValue.trim();
    if (!value) return;
    let start = 0;
    while (start < text.length) {
      const index = text.indexOf(value, start);
      if (index < 0) break;
      candidates.push({
        id: `dictionary-${index}-${index + value.length}`,
        type: 'custom',
        value,
        start: index,
        end: index + value.length,
        source: 'dictionary',
        enabled: true,
      });
      start = index + value.length;
    }
  });
  return normalizeCandidates(candidates);
};

export const addManualSensitiveValue = (
  text: string,
  rawValue: string,
  current: PrivacyCandidate[],
): PrivacyCandidate[] => {
  const value = rawValue.trim();
  if (!value) return current;
  const additions: PrivacyCandidate[] = [];
  let start = 0;
  while (start < text.length) {
    const index = text.indexOf(value, start);
    if (index < 0) break;
    const candidate: PrivacyCandidate = {
      id: `custom-${index}-${index + value.length}`,
      type: 'custom',
      value,
      start: index,
      end: index + value.length,
      source: 'manual',
      enabled: true,
    };
    if (!current.some((item) => item.start === candidate.start && item.end === candidate.end)) {
      additions.push(candidate);
    }
    start = index + value.length;
  }
  return normalizeCandidates([...current, ...additions]);
};

const placeholderType = (type: PrivacyEntityType) => type.toUpperCase();

export const maskSensitiveText = (text: string, candidates: PrivacyCandidate[]): PrivacyMaskResult => {
  const enabled = normalizeCandidates(candidates.filter((item) => item.enabled));
  const counters = new Map<PrivacyEntityType, number>();
  const mappingByValue = new Map<string, PrivacyMapping>();
  let cursor = 0;
  let maskedText = '';

  enabled.forEach((candidate) => {
    const mappingKey = `${candidate.type}\u0000${candidate.value}`;
    let mapping = mappingByValue.get(mappingKey);
    if (!mapping) {
      const next = (counters.get(candidate.type) || 0) + 1;
      counters.set(candidate.type, next);
      mapping = {
        placeholder: `⟦TC_${placeholderType(candidate.type)}_${String(next).padStart(3, '0')}⟧`,
        value: candidate.value,
        type: candidate.type,
        occurrences: 0,
        trimAddedSpaceBefore: true,
        trimAddedSpaceAfter: true,
      };
      mappingByValue.set(mappingKey, mapping);
    }
    mapping.occurrences += 1;
    if (candidate.start > 0 && /[ \t]/.test(text[candidate.start - 1])) {
      mapping.trimAddedSpaceBefore = false;
    }
    if (candidate.end < text.length && /[ \t]/.test(text[candidate.end])) {
      mapping.trimAddedSpaceAfter = false;
    }
    maskedText += text.slice(cursor, candidate.start) + mapping.placeholder;
    cursor = candidate.end;
  });
  maskedText += text.slice(cursor);

  return { maskedText, mappings: [...mappingByValue.values()] };
};

const countOccurrences = (text: string, value: string) => text.split(value).length - 1;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const restoreSensitiveText = (text: string, mappings: PrivacyMapping[]) => {
  for (const mapping of mappings) {
    const actual = countOccurrences(text, mapping.placeholder);
    if (actual !== mapping.occurrences) {
      throw new Error(`隐私占位符“${PRIVACY_TYPE_LABELS[mapping.type]}”未被完整保留，请重试`);
    }
  }
  return mappings.reduce((result, mapping) => {
    const placeholder = escapeRegExp(mapping.placeholder);
    const before = mapping.trimAddedSpaceBefore ? '[ \\t]*' : '';
    const after = mapping.trimAddedSpaceAfter ? '[ \\t]*' : '';
    return result.replace(new RegExp(`${before}${placeholder}${after}`, 'g'), mapping.value);
  }, text);
};
