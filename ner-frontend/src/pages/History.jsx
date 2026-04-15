import { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Alert,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import API from '../api/axios';
import EntityChip from '../components/EntityChip';

const ENTITY_TABS = ['ALL', 'PERSON', 'ORG', 'LOCATION', 'DATE', 'EVENT'];

const matchesTab = (article, activeTab) => {
  if (activeTab === 'ALL') {
    return true;
  }

  return (article.extractedEntities || []).some(
    (entity) => entity.label === activeTab
  );
};

export default function History() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');

        const endpoint = search.trim() ? '/articles/search' : '/articles';
        const config = search.trim()
          ? { params: { q: search.trim() } }
          : undefined;

        const res = await API.get(endpoint, config);
        setArticles(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            'Unable to load article history right now.'
        );
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredArticles = useMemo(
    () => articles.filter((article) => matchesTab(article, activeTab)),
    [articles, activeTab]
  );

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4">History</Typography>

      <TextField
        fullWidth
        label="Search by entity"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ mt: 3, mb: 2 }}
      />

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        {ENTITY_TABS.map((tab) => {
          const count =
            tab === 'ALL'
              ? articles.length
              : articles.filter((article) => matchesTab(article, tab)).length;

          return <Tab key={tab} label={`${tab} (${count})`} value={tab} />;
        })}
      </Tabs>

      {loading && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!loading &&
        filteredArticles.map((article) => {
          const visibleEntities =
            activeTab === 'ALL'
              ? article.extractedEntities || []
              : (article.extractedEntities || []).filter(
                  (entity) => entity.label === activeTab
                );

          return (
            <Card key={article._id} sx={{ mt: 2 }}>
              <CardContent>
                {article.title && (
                  <Typography variant="h6" gutterBottom>
                    {article.title}
                  </Typography>
                )}

                <Typography>
                  {(article.content || '').slice(0, 180)}
                  {(article.content || '').length > 180 ? '...' : ''}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1 }}
                >
                  Entities: {article.extractedEntities?.length || 0}
                </Typography>

                <Box sx={{ mt: 1 }}>
                  {visibleEntities.length ? (
                    visibleEntities.map((entity, index) => (
                      <EntityChip
                        key={`${article._id}-${entity.label}-${entity.text}-${index}`}
                        {...entity}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No entities for the selected filter in this article.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}

      {!loading && !filteredArticles.length && !error && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No articles matched the current entity search/filter.
        </Typography>
      )}
    </Container>
  );
}
