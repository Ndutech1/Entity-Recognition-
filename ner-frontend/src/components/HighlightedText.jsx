//ner-frontend/components/HighlightedText.jsx
export default function HighlightedText({ text = '', entities = [] }) {
  if (!entities.length) {
    return text;
  }

  const sorted = [...entities]
    .filter(
      (entity) =>
        Number.isInteger(entity.start) &&
        Number.isInteger(entity.end) &&
        entity.start >= 0 &&
        entity.end > entity.start &&
        entity.end <= text.length
    )
    .sort((a, b) => a.start - b.start);

  if (!sorted.length) {
    return text;
  }

  const result = [];
  let lastIndex = 0;

  sorted.forEach((entity, index) => {
    if (entity.start < lastIndex) {
      return;
    }

    result.push(text.slice(lastIndex, entity.start));
    result.push(
      <span
        key={`${entity.label}-${entity.start}-${entity.end}-${index}`}
        style={{
          backgroundColor: '#1976d2',
          color: '#fff',
          padding: '2px 4px',
          borderRadius: '4px',
          margin: '0 2px',
        }}
      >
        {text.slice(entity.start, entity.end)}
      </span>
    );

    lastIndex = entity.end;
  });

  result.push(text.slice(lastIndex));

  return result;
}
