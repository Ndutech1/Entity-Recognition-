import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Stack,
  Chip,
} from '@mui/material';
import API from '../api/axios';
import HighlightedText from '../components/HighlightedText';
import EntityChip from '../components/EntityChip';

const ENTITY_TABS = ['ALL', 'PERSON', 'ORG', 'LOCATION', 'DATE', 'EVENT'];

const filterEntitiesByLabel = (entities, activeTab) => {
  if (activeTab === 'ALL') {
    return entities;
  }

  return entities.filter((entity) => entity.label === activeTab);
};

export default function ProcessArticle() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const latestRequestRef = useRef(0);

  useEffect(() => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setResult(null);
      setError('');
      setSuccess('');
      return;
    }

    if (trimmedContent.length < 10) {
      setResult(null);
      setError('Keep typing to at least 10 characters for instant NER.');
      setSuccess('');
      return;
    }

    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');

        const res = await API.post('/articles/analyze', {
          title,
          content: trimmedContent,
        });

        if (latestRequestRef.current === requestId) {
          setResult(res.data);
        }
      } catch (err) {
        if (latestRequestRef.current === requestId) {
          setResult(null);
          setError(
            err.response?.data?.message ||
              'Unable to analyze the article right now.'
          );
        }
      } finally {
        if (latestRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, content]);

  const visibleEntities = useMemo(
    () => filterEntitiesByLabel(result?.extractedEntities || [], activeTab),
    [result, activeTab]
  );

  const handleSave = async () => {
    const trimmedContent = content.trim();

    if (trimmedContent.length < 10) {
      setError('Article content must be at least 10 characters before saving.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await API.post('/articles/process', {
        title,
        content: trimmedContent,
      });

      setResult(res.data);
      setSuccess('Article processed and saved to history.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to save the article right now.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Real-Time Nigerian News NER
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Named entities are extracted automatically after you pause typing.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Article title (optional)"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <TextField
          fullWidth
          multiline
          rows={8}
          label="Paste article here..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || loading || content.trim().length < 10}
          >
            {saving ? 'Saving...' : 'Save Article'}
          </Button>

          {loading && <CircularProgress size={24} />}

          <Typography variant="body2" color="text.secondary">
            {content.trim().length >= 10
              ? 'Live analysis is active.'
              : 'Instant NER starts at 10 characters.'}
          </Typography>
        </Stack>
      </Stack>

      {result && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Highlighted Text</Typography>

          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            sx={{ mt: 2, mb: 2 }}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {ENTITY_TABS.map((tab) => {
              const count =
                tab === 'ALL'
                  ? (result.extractedEntities || []).length
                  : (result.extractedEntities || []).filter(
                      (entity) => entity.label === tab
                    ).length;

              return <Tab key={tab} label={`${tab} (${count})`} value={tab} />;
            })}
          </Tabs>

          <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <HighlightedText
              text={result.content || ''}
              entities={visibleEntities}
            />
          </Box>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Entities
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {ENTITY_TABS.filter((tab) => tab !== 'ALL').map((tab) => {
              const count = (result.extractedEntities || []).filter(
                (entity) => entity.label === tab
              ).length;

              return <Chip key={tab} label={`${tab}: ${count}`} variant="outlined" />;
            })}
          </Stack>

          <Box sx={{ mt: 2 }}>
            {visibleEntities.length ? (
              visibleEntities.map((entity, index) => (
                <EntityChip
                  key={`${entity.label}-${entity.text}-${index}`}
                  {...entity}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No entities found for the selected filter.
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Container>
  );
}
