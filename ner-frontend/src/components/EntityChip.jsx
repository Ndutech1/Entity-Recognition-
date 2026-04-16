//ner-frontend/src/components/EntityChip.jsx
import { Chip } from '@mui/material';

const colors = {
  PERSON: 'primary',
  ORG: 'secondary',
  LOCATION: 'success',
  DATE: 'warning',
  EVENT: 'info',
};

export default function EntityChip({ label, text }) {
  return (
    <Chip
      label={`${text} (${label})`}
      color={colors[label] || 'default'}
      sx={{ m: 0.5 }}
    />
  );
}
