import { extractPreviewRoutes, parsePreviewCommand, resolvePreviewRoute } from './previewRoutes';

describe('previewRoutes', () => {
  describe('extractPreviewRoutes', () => {
    it('extracts route paths from source files', () => {
      const routes = extractPreviewRoutes({
        'src/App.tsx': `
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path='/apply' element={<Apply />} />
            <Route path={"/about"} element={<About />} />
            <Route path="/items/:id" element={<Item />} />
            <Route path="*" element={<NotFound />} />
          </Routes>`,
        'README.md': '<Route path="/ignored" />',
      });

      expect(routes).toEqual(['/', '/about', '/apply', '/items/:id']);
    });

    it('returns an empty list when there are no routes', () => {
      expect(extractPreviewRoutes({ 'src/main.tsx': 'render(<App />)' })).toEqual([]);
    });
  });

  describe('resolvePreviewRoute', () => {
    const routes = ['/', '/about', '/apply', '/forms/review', '/items/:id'];

    it('matches an exact path regardless of case and trailing slash', () => {
      expect(resolvePreviewRoute('/Apply/', routes)).toBe('/apply');
    });

    it('matches a bare name', () => {
      expect(resolvePreviewRoute('about', routes)).toBe('/about');
    });

    it('matches the root route', () => {
      expect(resolvePreviewRoute('/', routes)).toBe('/');
    });

    it('matches a concrete path for a parameterized route', () => {
      expect(resolvePreviewRoute('/items/5', routes)).toBe('/items/5');
    });

    it('matches a unique trailing segment', () => {
      expect(resolvePreviewRoute('review', routes)).toBe('/forms/review');
    });

    it('preserves the query string', () => {
      expect(resolvePreviewRoute('/apply?step=2', routes)).toBe('/apply?step=2');
    });

    it('returns null when nothing matches', () => {
      expect(resolvePreviewRoute('/missing', routes)).toBeNull();
    });

    it('returns null when a trailing segment is ambiguous', () => {
      expect(resolvePreviewRoute('review', ['/a/review', '/b/review'])).toBeNull();
    });
  });

  describe('parsePreviewCommand', () => {
    it('parses /go with an argument', () => {
      expect(parsePreviewCommand('/go /apply')).toEqual({ name: 'go', argument: '/apply' });
    });

    it('parses /go without an argument', () => {
      expect(parsePreviewCommand('/go')).toEqual({ name: 'go', argument: '' });
    });

    it('parses /routes', () => {
      expect(parsePreviewCommand('  /routes ')).toEqual({ name: 'routes' });
    });

    it('ignores other text, including other slash-prefixed messages', () => {
      expect(parsePreviewCommand('/apply page is broken')).toBeNull();
      expect(parsePreviewCommand('please /go home')).toBeNull();
      expect(parsePreviewCommand('/gone')).toBeNull();
    });
  });
});
