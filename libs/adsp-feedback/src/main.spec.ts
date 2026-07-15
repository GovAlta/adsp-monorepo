import { AdspFeedback } from './main';
describe('AdspFeedback selectRating', () => {
  let adspFeedback: AdspFeedback;
  beforeEach(() => {
    adspFeedback = new AdspFeedback();
    document.body.innerHTML = `
      <div>
        <div class="rating" data-index="0"><img class="adsp-fb-rating-icon" src="defaultImage1" /></div>
        <div class="rating" data-index="1"><img class="adsp-fb-rating-icon" src="defaultImage2" /></div>
        <div class="rating" data-index="2"><img class="adsp-fb-rating-icon" src="defaultImage3" /></div>
        <div class="rating" data-index="3"><img class="adsp-fb-rating-icon" src="defaultImage4" /></div>
        <div class="rating" data-index="4"><img class="adsp-fb-rating-icon" src="defaultImage5" /></div>
        <div class="adsp-fb-rating-text" data-index="0"></div>
        <div class="adsp-fb-rating-text" data-index="1"></div>
        <div class="adsp-fb-rating-text" data-index="2"></div>
        <div class="adsp-fb-rating-text" data-index="3"></div>
        <div class="adsp-fb-rating-text" data-index="4"></div>
        <div class="adsp-fb-tooltip-text" data-index="0"></div>
        <div class="adsp-fb-tooltip-text" data-index="1"></div>
        <div class="adsp-fb-tooltip-text" data-index="2"></div>
        <div class="adsp-fb-tooltip-text" data-index="3"></div>
        <div class="adsp-fb-tooltip-text" data-index="4"></div>
        <button class="adsp-fb-form-primary" disabled></button>
      </div>
    `;
    adspFeedback['ratings'] = [
      {
        svgClick: 'clickedImage1',
        svgDefault: 'defaultImage1',
        svgHover: 'hoverImage1',
        svgError: 'errorImage1',
        label: 'Very Difficult',
        rate: 'terrible',
        value: 0,
      },
      {
        svgClick: 'clickedImage2',
        svgDefault: 'defaultImage2',
        svgHover: 'hoverImage2',
        svgError: 'errorImage2',
        label: 'Difficult',
        rate: 'bad',
        value: 1,
      },
      {
        svgClick: 'clickedImage3',
        svgDefault: 'defaultImage3',
        svgHover: 'hoverImage3',
        svgError: 'errorImage3',
        label: 'Neutral',
        rate: 'neutral',
        value: 2,
      },
      {
        svgClick: 'clickedImage4',
        svgDefault: 'defaultImage4',
        svgHover: 'hoverImage4',
        svgError: 'errorImage4',
        label: 'Easy',
        rate: 'good',
        value: 3,
      },
      {
        svgClick: 'clickedImage5',
        svgDefault: 'defaultImage5',
        svgHover: 'hoverImage5',
        svgError: 'errorImage5',
        label: 'Very Easy',
        rate: 'delightful',
        value: 4,
      },
    ];
    adspFeedback['commentSelector'] = { value: document.createElement('input') }; // Create an input element
    if (adspFeedback['commentSelector'].value) {
      adspFeedback['commentSelector'].value.checked = true;
    }
    adspFeedback['sendButtonRef'] = { value: document.createElement('button') };
    adspFeedback['feedbackFormRef'] = { value: document.createElement('div') };
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });
  it('should select the correct rating and update the image source', () => {
    const ratingIndex = 2;
    const previousRating = adspFeedback['selectedRating'];
    adspFeedback['selectRating'](ratingIndex);
    // Verify the new image source is updated
    const images = document.querySelectorAll('.adsp-fb-rating-icon') as NodeListOf<HTMLImageElement>;
    expect(images[ratingIndex].src).toContain('clickedImage3');
    if (previousRating !== -1) {
      const previousImage = images[previousRating] as HTMLImageElement;
      expect(previousImage.src).toContain(adspFeedback['ratings'][previousRating].svgDefault);
    }
    // Verify selected rating is updated
    expect(adspFeedback['selectedRating']).toBe(ratingIndex);
    // Verify the text color is updated (Convert RGB to HEX)
    const texts = document.querySelectorAll('.adsp-fb-rating-text') as NodeListOf<HTMLImageElement>;
    const text = texts[ratingIndex] as HTMLImageElement;
    const rgbToHex = (rgb: string) => {
      const rgbValues = rgb.match(/\d+/g)?.map(Number);
      if (!rgbValues) return rgb;
      return `#${((1 << 24) + (rgbValues[0] << 16) + (rgbValues[1] << 8) + rgbValues[2])
        .toString(16)
        .slice(1)
        .toUpperCase()}`;
    };
    if (text.style.color) {
      expect(rgbToHex(text.style.color)).toBe('#0081A2');
    }
  });
  it('should enable send button when commentSelector is checked', () => {
    const ratingIndex = 1;
    adspFeedback['commentSelector'].value.checked = true;
    adspFeedback['selectRating'](ratingIndex);
    // Verify the send button is enabled
    expect(adspFeedback['sendButtonRef'].value?.disabled).toBe(false);
  });
  it('should disable send button if commentSelector is unchecked', () => {
    adspFeedback['commentSelector'].value.checked = false;
    const ratingIndex = 3;
    adspFeedback['selectRating'](ratingIndex);
    // Check that the send button should remain disabled
    adspFeedback['sendButtonRef'].value.setAttribute('disabled', 'disabled');
    expect(adspFeedback['sendButtonRef'].value?.disabled).toBe(true);
  });
});

describe('AdspFeedback style isolation', () => {
  let adspFeedback: AdspFeedback;

  beforeEach(() => {
    adspFeedback = new AdspFeedback();
    adspFeedback['ratings'] = [
      {
        svgClick: 'clickedImage1',
        svgDefault: 'defaultImage1',
        svgHover: 'hoverImage1',
        svgError: 'errorImage1',
        label: 'Very Difficult',
        rate: 'terrible',
        value: 0,
      },
      {
        svgClick: 'clickedImage2',
        svgDefault: 'defaultImage2',
        svgHover: 'hoverImage2',
        svgError: 'errorImage2',
        label: 'Difficult',
        rate: 'bad',
        value: 1,
      },
      {
        svgClick: 'clickedImage3',
        svgDefault: 'defaultImage3',
        svgHover: 'hoverImage3',
        svgError: 'errorImage3',
        label: 'Neutral',
        rate: 'neutral',
        value: 2,
      },
      {
        svgClick: 'clickedImage4',
        svgDefault: 'defaultImage4',
        svgHover: 'hoverImage4',
        svgError: 'errorImage4',
        label: 'Easy',
        rate: 'good',
        value: 3,
      },
      {
        svgClick: 'clickedImage5',
        svgDefault: 'defaultImage5',
        svgHover: 'hoverImage5',
        svgError: 'errorImage5',
        label: 'Very Easy',
        rate: 'delightful',
        value: 4,
      },
    ];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('does not update host elements that use the same class names as widget elements', () => {
    document.body.innerHTML = `
      <main id="host-content">
        <img id="host-rating" class="rating" src="host-default" />
        <p id="host-rating-text" class="ratingText">Host rating text</p>
        <span id="host-tooltip" class="tooltip-text">Host tooltip</span>
        <input id="host-radio" class="radio" />
        <div id="host-overlay" class="overlay"></div>
      </main>
      <div id="widget-root">
        <img class="adsp-fb-rating-icon" src="defaultImage1" />
        <img class="adsp-fb-rating-icon" src="defaultImage2" />
        <img class="adsp-fb-rating-icon" src="defaultImage3" />
        <img class="adsp-fb-rating-icon" src="defaultImage4" />
        <img class="adsp-fb-rating-icon" src="defaultImage5" />
        <p class="adsp-fb-rating-text">Very Difficult</p>
        <p class="adsp-fb-rating-text">Difficult</p>
        <p class="adsp-fb-rating-text">Neutral</p>
        <p class="adsp-fb-rating-text">Easy</p>
        <p class="adsp-fb-rating-text">Very Easy</p>
        <span class="adsp-fb-tooltip-text">Very Difficult</span>
        <span class="adsp-fb-tooltip-text">Difficult</span>
        <span class="adsp-fb-tooltip-text">Neutral</span>
        <span class="adsp-fb-tooltip-text">Easy</span>
        <span class="adsp-fb-tooltip-text">Very Easy</span>
      </div>
    `;
    adspFeedback['rootRef'] = { value: document.getElementById('widget-root') as HTMLDivElement };

    adspFeedback['updateHover'](0, true);

    const hostRating = document.getElementById('host-rating') as HTMLImageElement;
    const hostText = document.getElementById('host-rating-text') as HTMLElement;
    const hostTooltip = document.getElementById('host-tooltip') as HTMLElement;
    const hostRadio = document.getElementById('host-radio') as HTMLElement;
    const hostOverlay = document.getElementById('host-overlay') as HTMLElement;
    const widgetRating = document.querySelector('#widget-root .adsp-fb-rating-icon') as HTMLImageElement;

    expect(hostRating.getAttribute('src')).toBe('host-default');
    expect(hostText.style.color).toBe('');
    expect(hostTooltip.style.visibility).toBe('');
    expect(hostRadio.classList.contains('error')).toBe(false);
    expect(hostOverlay.style.visibility).toBe('');
    expect(widgetRating.getAttribute('src')).toBe('hoverImage1');
  });

  it('injects widget styles using scoped selectors', () => {
    document.head.innerHTML = '<title>Host page</title>';
    document.body.innerHTML = '';

    adspFeedback.initialize({ tenant: 'autotest', apiUrl: 'http://localhost/feedback/v1/feedback' });

    const styleText = Array.from(document.head.querySelectorAll('#adsp-feedback-widget-styles'))
      .map((style) => style.textContent)
      .join('\n');

    expect(document.head.querySelector('title')?.textContent).toBe('Host page');
    expect(styleText).toContain('.adsp-fb *');
    expect(styleText).toContain('.adsp-fb p');
    expect(styleText).toContain('line-height: 1.5;');
    expect(styleText).toContain('font-size: 1.125rem;');
    expect(styleText).toContain('.adsp-fb .adsp-fb-badge span');
    expect(styleText).toContain('color: var(--color-gray-600, #666666);');
    expect(styleText).toContain('margin: 0;');
    expect(styleText).toContain(
      'box-shadow: 0 0 0 var(--goa-border-width-m, 2px) var(--goa-color-interactive-hover, #004f84);',
    );
    expect(styleText).toContain('box-shadow: 0 0 0 3px var(--goa-color-interactive-focus, #feba35);');
    expect(styleText).toContain('box-shadow: 0 0 0 var(--goa-border-width-m, 2px) red;');
    expect(styleText).toContain('.adsp-fb .h3-sub-title');
    expect(styleText).toContain('font-size: var(--fs-xl, 1.5rem)');
    expect(styleText).toContain('font-weight: var(--fw-regular, 400)');
    expect(styleText).toContain('line-height: var(--lh-lg, 2rem)');
    expect(styleText).toContain('.adsp-fb h3.h3-error');
    expect(styleText.match(/margin-bottom: 0;/g)).toHaveLength(2);
    expect(styleText).toContain('margin: 0 !important;');
    expect(styleText).toContain('margin-block-end: 0 !important;');
    expect(styleText).toContain('.adsp-fb .h3-success');
    expect(styleText).toContain('.adsp-fb .adsp-fb-sent .p-content');
    expect(styleText).toContain('.adsp-fb .adsp-fb-sent button.adsp-fb-form-primary');
    expect(styleText).toContain('.adsp-fb .adsp-fb-tooltip-text');
    expect(styleText).toContain('.adsp-fb .adsp-fb-radio');
    expect(styleText).toContain('.adsp-fb .adsp-fb-rating-icon');
    expect(styleText).toContain('.adsp-fb .adsp-fb-rating-text');
    expect(styleText).toContain('width: 46px !important;');
    expect(styleText).toContain('filter: none !important;');
    expect(styleText).toContain('.adsp-fb-root .adsp-fb-overlay');
    expect(styleText).not.toMatch(/(^|\n)\s*body\.modal-open\b/);
    expect(styleText).not.toMatch(/(^|\n)\s*\.tooltip-text\b/);
    expect(styleText).not.toMatch(/(^|\n)\s*\.radio\b/);
    expect(styleText).not.toMatch(/(^|\n)\s*\.ratingText\b/);
    expect(styleText).not.toMatch(/(^|\n)\s*\.overlay\b/);
  });

  it('locks body scrolling without adding a global modal class', () => {
    document.body.style.overflow = 'auto';

    adspFeedback['lockBodyScroll']();

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.classList.contains('modal-open')).toBe(false);

    adspFeedback['unlockBodyScroll']();

    expect(document.body.style.overflow).toBe('auto');
  });
});
