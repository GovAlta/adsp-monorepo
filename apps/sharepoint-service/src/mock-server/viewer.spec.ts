import { DEMO_LIST_ID, DEMO_SITE_ID, defaultSeed } from './seed';
import { MockState } from './state';
import { renderViewer } from './viewer';

describe('renderViewer', () => {
  let state: MockState;

  beforeEach(() => {
    state = new MockState(defaultSeed);
  });

  it('shows each site with its lists, columns and items', () => {
    state.createItem(DEMO_LIST_ID, { FirstName: 'Ada', Amount: 5 });

    const html = renderViewer(state);

    expect(html).toContain('HR intake site');
    expect(html).toContain(`<code>${DEMO_SITE_ID}</code>`);
    expect(html).toContain('<th>FirstName</th>');
    expect(html).toContain('<td>Ada</td>');
    expect(html).toContain('<td>5</td>');
  });

  it('says when a list has no items', () => {
    expect(renderViewer(state)).toContain('No items');
  });

  it('shows object values, such as a Hyperlink, as JSON', () => {
    state.createItem(DEMO_LIST_ID, { FirstName: { Url: 'https://sp.example/a', Description: 'a' } });

    expect(renderViewer(state)).toContain('{&quot;Url&quot;:&quot;https://sp.example/a&quot;');
  });

  it('escapes values so pushed data cannot inject markup', () => {
    state.createItem(DEMO_LIST_ID, { FirstName: '<script>alert("x")</script>' });
    state.createList(state.findSite(DEMO_SITE_ID), '<b>Pets</b>');

    const html = renderViewer(state);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;Pets&lt;/b&gt;');
  });
});
