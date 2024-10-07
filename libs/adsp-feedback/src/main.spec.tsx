import { screen, render } from '@testing-library/react';
import AdspFeedback from './main';

describe('AdspFeedback selectRating', () => {
  let adspFeedback: AdspFeedback;

  beforeEach(() => {
    adspFeedback = new AdspFeedback();
    document.body.innerHTML = `
      <div>
        <div class="rating" data-index="0"></div>
        <div class="rating" data-index="1"></div>
        <div class="rating" data-index="2"></div>
        <div class="rating" data-index="3"></div>
        <div class="rating" data-index="4"></div>
        <div class="ratingText"></div>
        <button class="adsp-fb-form-primary"></button>
      </div>
    `;

    adspFeedback.ratings = [
      { svgClick: 'clickedImage1', svgDefault: 'defaultImage1' },
      { svgClick: 'clickedImage2', svgDefault: 'defaultImage2' },
      { svgClick: 'clickedImage3', svgDefault: 'defaultImage3' },
      { svgClick: 'clickedImage4', svgDefault: 'defaultImage4' },
      { svgClick: 'clickedImage5', svgDefault: 'defaultImage5' },
    ];

    adspFeedback.feedbackFormRef = { value: document.createElement('div') };
    adspFeedback.ratingSelector = { value: document.createElement('input') };
    adspFeedback.commentSelector = { value: document.createElement('input') };
    adspFeedback.sendButtonRef = { value: document.createElement('button') };
  });

  it('should select the correct rating and update the image source', () => {
    const ratingIndex = 2;
    adspFeedback.selectRating(ratingIndex);

    const images = document.querySelectorAll('.rating');
    const selectedImage = images[ratingIndex] as HTMLImageElement;
    expect(selectedImage.src).toContain('clickedImage3');

    if (adspFeedback.selectedRating !== -1) {
      const previousImage = images[adspFeedback.selectedRating] as HTMLImageElement;
      expect(previousImage.src).toContain(adspFeedback.ratings[adspFeedback.selectedRating].svgDefault);
    }

    expect(adspFeedback.selectedRating).toBe(ratingIndex);

    const texts = document.querySelectorAll('.ratingText');
    const text = texts[ratingIndex] as HTMLImageElement;
    expect(text.style.color).toBe('#0081A2');
  });

  it('should enable send button when rating is selected and radio2 is checked', () => {
    const ratingIndex = 2;
    adspFeedback.commentSelector.value.checked = true;
    adspFeedback.selectRating(ratingIndex);

    expect(adspFeedback.sendButtonRef.value?.hasAttribute('disabled')).toBe(false);
  });

  it('should enable send button when rating is selected and radio1 is checked', () => {
    const ratingIndex = 1;
    adspFeedback.ratingSelector.value.checked = true;
    adspFeedback.selectRating(ratingIndex);

    expect(adspFeedback.sendButtonRef.value?.hasAttribute('disabled')).toBe(false);
  });

  it('should disable send button if no rating is selected and radios are unchecked', () => {
    const ratingIndex = 3;
    adspFeedback.ratingSelector.value.checked = false;
    adspFeedback.commentSelector.value.checked = false;

    adspFeedback.selectRating(ratingIndex);

    expect(adspFeedback.sendButtonRef.value?.hasAttribute('disabled')).toBe(true);
  });
});
