//backend/services/ner.service.js
const { pipeline } = require('@xenova/transformers');
const logger = require('../Utils/logger');

let nerPipeline;

const NIGERIAN_LOCATIONS = [
  'Nigeria',
  'Federal Capital Territory',
  'Abuja',
  'Lagos',
  'Kano',
  'Ibadan',
  'Port Harcourt',
  'Benin City',
  'Enugu',
  'Jos',
  'Kaduna',
  'Abeokuta',
  'Maiduguri',
  'Ilorin',
  'Owerri',
  'Uyo',
  'Calabar',
  'Warri',
  'Ikeja',
  'Lekki',
  'Yaba',
  'Ikoyi',
  'Ajah',
  'Onitsha',
  'Awka',
  'Sokoto',
  'Bauchi',
  'Lokoja',
  'Akure',
  'Osogbo',
  'Ado Ekiti',
  'Asaba',
  'Yenagoa',
  'Gombe',
  'Lafia',
  'Minna',
  'Katsina',
  'Kebbi',
  'Birnin Kebbi',
  'Damaturu',
  'Jalingo',
  'Makurdi',
  'Ogun State',
  'Lagos State',
  'Kano State',
  'Kaduna State',
  'Rivers State',
  'Enugu State',
  'Oyo State',
  'Delta State',
  'Anambra State',
];

const NIGERIAN_ORGANIZATIONS = [
  'INEC',
  'NNPC',
  'NNPCL',
  'EFCC',
  'CBN',
  'NUPRC',
  'NEMA',
  'NCDC',
  'FRSC',
  'DSS',
  'NTA',
  'Channels Television',
  'Nigerian Senate',
  'House of Representatives',
  'Supreme Court',
  'Federal High Court',
  'Dangote',
  'Dangote Group',
  'Access Bank',
  'GTBank',
  'UBA',
  'First Bank',
  'Zenith Bank',
  'Flutterwave',
  'Paystack',
];

const PERSON_TITLES = [
  'Mr',
  'Mrs',
  'Miss',
  'Ms',
  'Dr',
  'Prof',
  'Professor',
  'Chief',
  'Hon',
  'Honourable',
  'Sen',
  'Senator',
  'Gov',
  'Governor',
  'President',
  'Vice President',
  'Minister',
  'Justice',
];

const EVENT_KEYWORDS = [
  'Convention',
  'Summit',
  'Election',
  'Elections',
  'Primary',
  'Primaries',
  'Congress',
  'Conference',
  'Forum',
  'Expo',
  'Festival',
  'Ceremony',
  'Protest',
  'Rally',
  'Meeting',
  'Dialogue',
  'Workshop',
  'Seminar',
  'Tournament',
  'Cup',
];

const ORGANIZATION_KEYWORDS = [
  'Commission',
  'Committee',
  'Agency',
  'Ministry',
  'Bank',
  'University',
  'College',
  'Authority',
  'Corporation',
  'Party',
  'Council',
  'Court',
  'Police',
  'Government',
  'Senate',
  'Assembly',
  'Association',
  'Group',
  'Company',
  'Ltd',
  'Limited',
  'Plc',
];

const DATE_PATTERNS = [
  /\b(?:\d{1,2}(?:st|nd|rd|th)?\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?\b/gi,
  /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
  /\b(?:today|tomorrow|yesterday|last week|next week|this week|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
];

const CAPITALIZED_SEQUENCE_PATTERN =
  /\b(?:[A-Z][a-z]+(?:[-'][A-Z][a-z]+)?)(?:\s+[A-Z][a-z]+(?:[-'][A-Z][a-z]+)?){1,3}\b/g;

const EVENT_PATTERN = new RegExp(
  `\\b(?:[A-Z][\\w'-]+(?:\\s+[A-Z][\\w'-]+){0,4}\\s+(?:${EVENT_KEYWORDS.join('|')}))\\b`,
  'g'
);

const ORGANIZATION_PATTERN = new RegExp(
  `\\b(?:[A-Z][\\w&'-]+(?:\\s+[A-Z][\\w&'-]+){0,5}\\s+(?:${ORGANIZATION_KEYWORDS.join('|')}))\\b`,
  'g'
);

const NOISE_TOKENS = new Set([
  '',
  "'",
  '"',
  ',',
  '.',
  ':',
  ';',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
]);

const PERSON_STOPWORDS = new Set([
  'The',
  'This',
  'That',
  'These',
  'Those',
  'National',
  'Federal',
  'Central',
  'Northern',
  'Southern',
  'Western',
  'Eastern',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]);

const LABEL_MAP = {
  PER: 'PERSON',
  ORG: 'ORG',
  LOC: 'LOCATION',
  MISC: 'MISC',
};

const normalizeLabel = (label = '') => {
  const stripped = label.replace(/^[BI][-_]/, '');
  return LABEL_MAP[stripped] || stripped;
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const cleanEntityText = (value = '') =>
  value
    .replace(/##/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([([{])\s+/g, '$1')
    .replace(/\s+([)\]}])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

const stripPersonTitle = (value = '') =>
  cleanEntityText(value).replace(
    new RegExp(
      `^(?:${PERSON_TITLES.map((title) => escapeRegex(title)).join('|')})\\.?\\s+`,
      'i'
    ),
    ''
  );

const normalizeEntityKey = (value = '') =>
  cleanEntityText(value).toLowerCase().replace(/\s+/g, ' ');

const shouldAttachWithoutSpace = (currentText, nextWord) => {
  if (!currentText) {
    return false;
  }

  return (
    nextWord.startsWith('##') ||
    /^[,.;:%!?)]/.test(nextWord) ||
    /[(/-]$/.test(currentText)
  );
};

const isNoiseEntity = (text) => {
  const cleaned = cleanEntityText(text);

  if (!cleaned || cleaned.length < 2 || NOISE_TOKENS.has(cleaned)) {
    return true;
  }

  if (/^\d+$/.test(cleaned)) {
    return true;
  }

  if (/^(plot|block|road|street)$/i.test(cleaned)) {
    return true;
  }

  return false;
};

const addEntityCandidate = (list, text, label, start, end, confidence = 0.95) => {
  const cleaned = cleanEntityText(text);

  if (isNoiseEntity(cleaned)) {
    return;
  }

  list.push({
    text: cleaned,
    label,
    start,
    end,
    confidence,
  });
};

const extractMatches = (text, pattern, label, confidence) => {
  const entities = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    addEntityCandidate(
      entities,
      match[0],
      label,
      match.index,
      match.index + match[0].length,
      confidence
    );
  }

  return entities;
};

const extractLookupEntities = (text) => {
  const entities = [];

  for (const location of NIGERIAN_LOCATIONS) {
    const pattern = new RegExp(`\\b${escapeRegex(location)}\\b`, 'gi');
    entities.push(...extractMatches(text, pattern, 'LOCATION', 0.99));
  }

  for (const organization of NIGERIAN_ORGANIZATIONS) {
    const pattern = new RegExp(`\\b${escapeRegex(organization)}\\b`, 'gi');
    entities.push(...extractMatches(text, pattern, 'ORG', 0.99));
  }

  return entities;
};

const extractDateEntities = (text) => {
  const entities = [];

  for (const pattern of DATE_PATTERNS) {
    entities.push(...extractMatches(text, pattern, 'DATE', 0.98));
  }

  return entities;
};

const extractEventEntities = (text) => extractMatches(text, EVENT_PATTERN, 'EVENT', 0.96);

const extractOrganizationEntities = (text) => {
  const entities = extractMatches(text, ORGANIZATION_PATTERN, 'ORG', 0.95);
  const acronymPattern = /\b[A-Z]{2,8}\b/g;

  for (const entity of extractMatches(text, acronymPattern, 'ORG', 0.9)) {
    if (entity.text.length >= 3 && !/^(THE|AND)$/i.test(entity.text)) {
      entities.push(entity);
    }
  }

  return entities;
};

const looksLikePersonName = (text) => {
  const parts = cleanEntityText(text).split(/\s+/);

  if (parts.length < 2 || parts.length > 4) {
    return false;
  }

  if (parts.some((part) => PERSON_STOPWORDS.has(part))) {
    return false;
  }

  if (parts.some((part) => ORGANIZATION_KEYWORDS.includes(part))) {
    return false;
  }

  return parts.every((part) => /^[A-Z][a-z]+(?:[-'][A-Z]?[a-z]+)?$/.test(part));
};

const extractPersonEntities = (text) => {
  const entities = [];
  const titledPattern = new RegExp(
    `\\b(?:${PERSON_TITLES.map(escapeRegex).join('|')})\\.?\\s+[A-Z][a-z]+(?:[-'][A-Z][a-z]+)?(?:\\s+[A-Z][a-z]+(?:[-'][A-Z][a-z]+)?){0,3}\\b`,
    'g'
  );

  let titledMatch;
  while ((titledMatch = titledPattern.exec(text)) !== null) {
    const nameOnly = stripPersonTitle(titledMatch[0]);
    const startOffset = titledMatch[0].indexOf(nameOnly);

    addEntityCandidate(
      entities,
      nameOnly,
      'PERSON',
      titledMatch.index + startOffset,
      titledMatch.index + startOffset + nameOnly.length,
      0.97
    );
  }

  let match;
  while ((match = CAPITALIZED_SEQUENCE_PATTERN.exec(text)) !== null) {
    if (looksLikePersonName(match[0])) {
      addEntityCandidate(
        entities,
        match[0],
        'PERSON',
        match.index,
        match.index + match[0].length,
        0.92
      );
    }
  }

  return entities;
};

const mergeModelTokens = (entities) => {
  const merged = [];

  for (const entity of entities) {
    const rawText = entity.word || entity.text || '';
    const text = cleanEntityText(rawText);
    const label = normalizeLabel(entity.entity || entity.label);
    const entityTag = entity.entity || entity.label || '';

    if (!label || isNoiseEntity(text)) {
      continue;
    }

    const current = {
      text,
      label,
      confidence: entity.score || entity.confidence || 0,
      start: entity.start,
      end: entity.end,
      index: entity.index,
    };

    const previous = merged[merged.length - 1];
    const sameLabel = previous && previous.label === current.label;
    const touching =
      previous &&
      typeof previous.end === 'number' &&
      typeof current.start === 'number' &&
      current.start - previous.end <= 1;
    const sequentialTokens =
      previous &&
      typeof previous.index === 'number' &&
      typeof current.index === 'number' &&
      current.index - previous.index === 1;
    const isContinuation =
      entityTag.startsWith('I-') ||
      entityTag.startsWith('I_') ||
      rawText.startsWith('##');

    if (
      previous &&
      sameLabel &&
      (touching || (sequentialTokens && isContinuation))
    ) {
      const separator = shouldAttachWithoutSpace(previous.text, rawText) ? '' : ' ';
      const nextText = rawText.startsWith('##') ? rawText.slice(2) : text;
      previous.text = cleanEntityText(`${previous.text}${separator}${nextText}`);
      previous.end = current.end;
      previous.index = current.index;
      previous.confidence = Math.max(previous.confidence, current.confidence);
      continue;
    }

    merged.push(current);
  }

  return merged.map(({ index, ...entity }) => entity);
};

const attachMissingSpans = (text, entities) => {
  let searchFrom = 0;

  const isBoundary = (index) => {
    if (index < 0 || index >= text.length) {
      return true;
    }

    return /[^A-Za-z0-9]/.test(text[index]);
  };

  return entities.map((entity) => {
    if (Number.isInteger(entity.start) && Number.isInteger(entity.end)) {
      return entity;
    }

    const pattern = new RegExp(`\\b${escapeRegex(entity.text)}\\b`, 'i');
    const slice = text.slice(searchFrom);
    const exactMatch = pattern.exec(slice);

    if (exactMatch) {
      const start = searchFrom + exactMatch.index;
      const end = start + exactMatch[0].length;
      searchFrom = end;
      return { ...entity, start, end };
    }

    const fallbackStart = text.toLowerCase().indexOf(entity.text.toLowerCase());
    if (fallbackStart >= 0) {
      const fallbackEnd = fallbackStart + entity.text.length;

      if (!isBoundary(fallbackStart - 1) || !isBoundary(fallbackEnd)) {
        return entity;
      }

      return {
        ...entity,
        start: fallbackStart,
        end: fallbackEnd,
      };
    }

    return entity;
  });
};

const resolveLabel = (entity) => {
  const normalizedText = normalizeEntityKey(entity.text);
  const cleaned = cleanEntityText(entity.text);

  if (EVENT_KEYWORDS.some((keyword) => new RegExp(`\\b${keyword}\\b`, 'i').test(cleaned))) {
    return 'EVENT';
  }

  if (
    DATE_PATTERNS.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(cleaned);
    })
  ) {
    return 'DATE';
  }

  if (normalizedText === 'nigeria') {
    return 'LOCATION';
  }

  if (
    NIGERIAN_LOCATIONS.some((location) => normalizeEntityKey(location) === normalizedText)
  ) {
    return 'LOCATION';
  }

  if (
    NIGERIAN_ORGANIZATIONS.some(
      (organization) => normalizeEntityKey(organization) === normalizedText
    )
  ) {
    return 'ORG';
  }

  if (entity.label === 'MISC' && EVENT_KEYWORDS.some((keyword) => cleaned.includes(keyword))) {
    return 'EVENT';
  }

  if (entity.label === 'MISC' && looksLikePersonName(cleaned)) {
    return 'PERSON';
  }

  return entity.label;
};

const scoreEntity = (entity) => {
  const labelWeights = {
    PERSON: 5,
    ORG: 4,
    LOCATION: 4,
    EVENT: 4,
    DATE: 4,
    MISC: 1,
  };

  return (entity.confidence || 0) + (labelWeights[entity.label] || 0);
};

const entitiesOverlap = (a, b) =>
  Number.isInteger(a.start) &&
  Number.isInteger(a.end) &&
  Number.isInteger(b.start) &&
  Number.isInteger(b.end) &&
  a.start < b.end &&
  b.start < a.end;

const preferEntity = (current, candidate) => {
  const currentLength = (current.end || 0) - (current.start || 0);
  const candidateLength = (candidate.end || 0) - (candidate.start || 0);
  const currentKey = normalizeEntityKey(current.text);
  const candidateKey = normalizeEntityKey(candidate.text);

  if (
    current.label === candidate.label &&
    (currentKey.includes(candidateKey) || candidateKey.includes(currentKey)) &&
    currentLength !== candidateLength
  ) {
    return candidateLength > currentLength ? candidate : current;
  }

  if (scoreEntity(candidate) !== scoreEntity(current)) {
    return scoreEntity(candidate) > scoreEntity(current) ? candidate : current;
  }

  if (candidateLength !== currentLength) {
    return candidateLength > currentLength ? candidate : current;
  }

  return normalizeEntityKey(candidate.text).length > normalizeEntityKey(current.text).length
    ? candidate
    : current;
};

const removeDuplicateAndConflictingEntities = (entities) => {
  const sorted = [...entities]
    .map((entity) => {
      const label = resolveLabel(entity);
      let text = cleanEntityText(entity.text);
      let start = entity.start;
      let end = entity.end;

      if (label === 'PERSON') {
        const stripped = stripPersonTitle(text);
        const offset = text.indexOf(stripped);

        if (stripped && stripped !== text && offset >= 0) {
          text = stripped;
          start += offset;
          end = start + stripped.length;
        }
      }

      return {
        ...entity,
        text,
        start,
        end,
        label,
      };
    })
    .filter(
      (entity) =>
        !isNoiseEntity(entity.text) &&
        Number.isInteger(entity.start) &&
        Number.isInteger(entity.end) &&
        entity.end > entity.start &&
        !(
          ['PERSON', 'LOCATION', 'ORG'].includes(entity.label) &&
          cleanEntityText(entity.text).length < 3
        )
    )
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const bySpanAndLabel = new Map();

  for (const entity of sorted) {
    const key = `${entity.start}:${entity.end}:${entity.label}`;
    const existing = bySpanAndLabel.get(key);
    if (!existing || scoreEntity(entity) > scoreEntity(existing)) {
      bySpanAndLabel.set(key, entity);
    }
  }

  const unique = [...bySpanAndLabel.values()].sort(
    (a, b) => a.start - b.start || b.end - a.end
  );
  const resolved = [];

  for (const candidate of unique) {
    const last = resolved[resolved.length - 1];

    if (!last || !entitiesOverlap(last, candidate)) {
      resolved.push(candidate);
      continue;
    }

    resolved[resolved.length - 1] = preferEntity(last, candidate);
  }

  const seenTextLabel = new Set();

  return resolved.filter((entity) => {
    const key = `${normalizeEntityKey(entity.text)}:${entity.label}`;

    if (
      seenTextLabel.has(key) &&
      ['PERSON', 'ORG', 'LOCATION', 'EVENT', 'DATE'].includes(entity.label)
    ) {
      return false;
    }

    seenTextLabel.add(key);
    return true;
  });
};

const extractRuleBasedEntities = (text) => [
  ...extractLookupEntities(text),
  ...extractDateEntities(text),
  ...extractEventEntities(text),
  ...extractOrganizationEntities(text),
  ...extractPersonEntities(text),
];

const loadModel = async () => {
  if (!nerPipeline) {
    logger.info('Loading NER model', {
      model: 'Xenova/bert-base-NER',
    });

    nerPipeline = await pipeline('token-classification', 'Xenova/bert-base-NER');

    logger.info('NER model loaded', {
      model: 'Xenova/bert-base-NER',
    });
  }
};

const extractEntities = async (text) => {
  await loadModel();

  const startedAt = Date.now();
  const rawResults = await nerPipeline(text);
  const mergedModelEntities = attachMissingSpans(text, mergeModelTokens(rawResults));
  const ruleBasedEntities = extractRuleBasedEntities(text);
  const finalResults = removeDuplicateAndConflictingEntities([
    ...mergedModelEntities,
    ...ruleBasedEntities,
  ]);

  logger.info('NER extraction completed', {
    durationMs: Date.now() - startedAt,
    rawCount: rawResults.length,
    mergedModelCount: mergedModelEntities.length,
    ruleBasedCount: ruleBasedEntities.length,
    finalCount: finalResults.length,
  });

  return finalResults;
};

module.exports = { extractEntities };
