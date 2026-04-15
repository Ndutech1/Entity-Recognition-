import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Alert,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import API from '../api/axios';

export default function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const res = await API.get('/articles');
        setArticles(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            'Unable to load dashboard data right now.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalArticles = articles.length;
  const totalEntities = articles.reduce(
    (acc, article) => acc + (article.extractedEntities?.length || 0),
    0
  );

  const entityBreakdown = articles.reduce((acc, article) => {
    article.extractedEntities?.forEach((entity) => {
      acc[entity.label] = (acc[entity.label] || 0) + 1;
    });
    return acc;
  }, {});

  const sortedEntityBreakdown = Object.entries(entityBreakdown).sort(
    (a, b) => b[1] - a[1]
  );
  const topEntities = sortedEntityBreakdown.slice(0, 8);

  if (loading) {
    return (
      <Box sx={{ mt: 14, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 88px)',
        background:
          'radial-gradient(circle at 10% 10%, rgba(25,118,210,0.08), transparent 45%), radial-gradient(circle at 90% 5%, rgba(34,197,94,0.09), transparent 40%), #f8fbff',
        py: { xs: 3, md: 5 },
      }}
    >
      <Container>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1.2 }}
          >
            Analytics Overview
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
            NER Intelligence Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.8 }}>
            Track extraction volume, monitor entity trends, and review recently
            processed content in one place.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid #e6edf5',
                boxShadow: '0 8px 30px rgba(14, 30, 37, 0.08)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Articles
                </Typography>
                <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                  {totalArticles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid #e6edf5',
                boxShadow: '0 8px 30px rgba(14, 30, 37, 0.08)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Entities
                </Typography>
                <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                  {totalEntities}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid #e6edf5',
                boxShadow: '0 8px 30px rgba(14, 30, 37, 0.08)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Entity Types
                </Typography>
                <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                  {Object.keys(entityBreakdown).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} lg={5}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid #e6edf5',
                boxShadow: '0 8px 30px rgba(14, 30, 37, 0.08)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Top Entity Breakdown
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Most frequently extracted entity labels.
                </Typography>

                {topEntities.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No entities found yet.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {topEntities.map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        sx={{
                          bgcolor: 'rgba(25,118,210,0.08)',
                          color: 'primary.dark',
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid #e6edf5',
                boxShadow: '0 8px 30px rgba(14, 30, 37, 0.08)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Articles
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Latest processed content with extracted entity count.
                </Typography>

                {articles.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No processed articles available yet.
                  </Typography>
                ) : (
                  <Stack spacing={1.75}>
                    {articles.slice(0, 5).map((article, index) => (
                      <Box key={article._id}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {article.title || 'Untitled Article'}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {(article.content || '').slice(0, 165)}
                          {(article.content || '').length > 165 ? '...' : ''}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', mt: 0.9, color: 'primary.main' }}
                        >
                          Entities extracted: {article.extractedEntities?.length || 0}
                        </Typography>
                        {index < 4 && <Divider sx={{ mt: 1.5 }} />}
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
