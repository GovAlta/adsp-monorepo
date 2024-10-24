import { AdspFeedback } from './main';

describe('AdspFeedback selectRating', () => {
  let adspFeedback: AdspFeedback;

  beforeEach(() => {
    adspFeedback = new AdspFeedback();

    document.body.innerHTML = `
      <div>
        <div class="rating" data-index="0"><img class="rating" src="defaultImage1" /></div>
        <div class="rating" data-index="1"><img class="rating" src="defaultImage2" /></div>
        <div class="rating" data-index="2"><img class="rating" src="defaultImage3" /></div>
        <div class="rating" data-index="3"><img class="rating" src="defaultImage4" /></div>
        <div class="rating" data-index="4"><img class="rating" src="defaultImage5" /></div>
        <div class="ratingText" data-index="0"></div>
        <div class="ratingText" data-index="1"></div>
        <div class="ratingText" data-index="2"></div>
        <div class="ratingText" data-index="3"></div>
        <div class="ratingText" data-index="4"></div>
        <div class="tooltip-text" data-index="0"></div>
        <div class="tooltip-text" data-index="1"></div>
        <div class="tooltip-text" data-index="2"></div>
        <div class="tooltip-text" data-index="3"></div>
        <div class="tooltip-text" data-index="4"></div>
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
    const images = document.querySelectorAll('.rating') as NodeListOf<HTMLImageElement>;
    expect(images[ratingIndex].src).toContain('clickedImage3');

    if (previousRating !== -1) {
      const previousImage = images[previousRating] as HTMLImageElement;
      expect(previousImage.src).toContain(adspFeedback['ratings'][previousRating].svgDefault);
    }

    // Verify selected rating is updated
    expect(adspFeedback['selectedRating']).toBe(ratingIndex);

    // Verify the text color is updated (Convert RGB to HEX)
    const texts = document.querySelectorAll('.ratingText') as NodeListOf<HTMLImageElement>;
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
