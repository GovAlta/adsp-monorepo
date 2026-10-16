import { expectNoA11yViolations } from './axe';

describe('expectNoA11yViolations', () => {
  const render = (html: string) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    return container;
  };

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('passes on accessible markup', async () => {
    const container = render('<button type="button">Save</button><img src="a.png" alt="Logo" />');

    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });

  it('fails on an unlabeled button', async () => {
    const container = render('<button type="button"></button>');

    await expect(expectNoA11yViolations(container)).rejects.toThrow(/button-name/);
  });

  it('fails on an image without alt text', async () => {
    const container = render('<img src="a.png" />');

    await expect(expectNoA11yViolations(container)).rejects.toThrow(/image-alt/);
  });

  it('lists the offending html in the message', async () => {
    const container = render('<img src="a.png" />');

    await expect(expectNoA11yViolations(container)).rejects.toThrow(/<img/);
  });

  it('allows rules to be disabled', async () => {
    const container = render('<img src="a.png" />');

    await expect(expectNoA11yViolations(container, { disableRules: ['image-alt'] })).resolves.toBeUndefined();
  });
});
