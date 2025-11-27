import { triggerInScope } from './autoComplete';
describe('Handlebar autocomplete', () => {
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
