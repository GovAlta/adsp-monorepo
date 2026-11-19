import { toVariablePaths, triggerInScope } from './autoComplete';
describe('Handlebar autocomplete', () => {
  describe('toVariablePaths', () => {
    it('lists each leaf as a full path', () => {
      const suggestions = [
        {
          label: 'event',
          insertText: 'event',
          children: [
            {
              label: 'payload',
              insertText: 'payload',
              children: [
                { label: 'form', insertText: 'form', children: [{ label: 'id', insertText: 'id' }] },
                { label: 'data', insertText: 'data', children: [] },
              ],
            },
          ],
        },
        { label: 'tenant', insertText: 'tenant', children: [{ label: 'name', insertText: 'name' }] },
        { label: 'subscriber', insertText: 'subscriber', children: [{ label: 'userId ', insertText: 'userId ' }] },
      ];

      expect(toVariablePaths(suggestions)).toEqual([
        'event.payload.form.id',
        'event.payload.data',
        'tenant.name',
        'subscriber.userId',
      ]);
    });

    it('returns no paths without suggestions', () => {
      expect(toVariablePaths(undefined)).toEqual([]);
      expect(toVariablePaths([{ label: '', insertText: '' }])).toEqual([]);
    });
  });

  describe('triggerInScope', () => {
    it('event in out of handlebar', () => {
      const text =
        'Test script: \n <html><head>\n </head>\n <body>\n My Body content test \n </body>\n </html>\n event';
      expect(triggerInScope(text, 8)).toBeFalsy();
    });
    it('event after beginning of handlebar', () => {
      const text =
        'Test script: \n <html><head>\n </head>\n <body>\n My Body content test \n </body>\n </html>\n {{event';
      expect(triggerInScope(text, 8)).toBeTruthy();
    });

    it('event inside of handlebar scope', () => {
      const text =
        'Test script: \n <html><head>\n </head>\n <body>\n My Body content test \n </body>\n </html>\n {{event}}';
      expect(triggerInScope(text, 8)).toBeTruthy();
    });
  });
});
