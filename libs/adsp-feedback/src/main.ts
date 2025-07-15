import { html, render } from 'lit-html';
import { ref, createRef, Ref } from 'lit-html/directives/ref.js';
import { AdspFeedback as AdspFeedbackApi, FeedbackContext, FeedbackOptions } from './types';

import blueUnderLineSvg from './assets/Blue-Underline.svg';
import closeOutlineSvg from './assets/close-outline.svg';
import errorIconSvg from './assets/Error_Icon.svg';
import greenCircleCheckmarkSvg from './assets/green-circle-checkmark.svg';
import openLinkSvg from './assets/Open-Link.svg';
import goaErrorIconSvg from './assets/goa-error-icon.svg';

import { ratings } from './ratings';
export class AdspFeedback implements AdspFeedbackApi {
  private tenant?: string;
  private apiUrl?: URL;
  private name?: string;
  private email?: string;
  private getAccessToken?: () => Promise<string>;
  private getContext: () => Promise<FeedbackContext>;

  private feedbackBadgeRef: Ref<HTMLDivElement> = createRef();
  private feedbackFormRef: Ref<HTMLDivElement> = createRef();
  private feedbackFormClassRef: Ref<HTMLDivElement> = createRef();
  private feedbackContentFormRef: Ref<HTMLDivElement> = createRef();
  private ratingRef: Ref<HTMLFieldSetElement> = createRef();
  private commentRef: Ref<HTMLTextAreaElement> = createRef();
  private sendButtonRef: Ref<HTMLButtonElement> = createRef();
  private startRef: Ref<HTMLFieldSetElement> = createRef();
  private technicalCommentDivRef: Ref<HTMLFieldSetElement> = createRef();
  private technicalCommentRef: Ref<HTMLTextAreaElement> = createRef();
  private dimRef: Ref<HTMLTextAreaElement> = createRef();
  private ratingSelector: Ref<HTMLInputElement> = createRef();
  private commentSelector: Ref<HTMLInputElement> = createRef();
  private firstFocusableElement?: Ref<HTMLElement>;
  private lastFocusableElement?: Ref<HTMLButtonElement>;
  private feedbackStartCloseButton: Ref<HTMLButtonElement> = createRef();
  private feedbackStartCloseImg: Ref<HTMLElement> = createRef();
  private feedbackFormCloseImg: Ref<HTMLElement> = createRef();
  private feedbackCloseErrorButton: Ref<HTMLButtonElement> = createRef();
  private feedbackCloseSuccessButton: Ref<HTMLButtonElement> = createRef();
  private cancelButtonRef: Ref<HTMLButtonElement> = createRef();

  private ratingErrorText: Ref<HTMLSpanElement> = createRef();
  private issueSelectionErrorText: Ref<HTMLSpanElement> = createRef();
  private technicalCommentErrorText: Ref<HTMLSpanElement> = createRef();

  private ratings = ratings;

  constructor() {
    const site = `${document.location.protocol}//${document.location.host}`;
    this.getContext = function () {
      return Promise.resolve({ site, view: document.location.pathname });
    };
    this.onDimChange(false);

    const scriptElement = document.currentScript as HTMLScriptElement;
    if (scriptElement) {
      const scriptUrl = new URL(scriptElement.src);
      this.apiUrl = new URL('/feedback/v1/feedback', scriptUrl);

      // If the script element is in body, try to default initialize the widget.
      // Note: This doesn't work if the script element is in head, since we might be trying
      // to mount the widget div before body is in the DOM tree.
      if (scriptElement.parentElement instanceof HTMLBodyElement) {
        const tenant = scriptUrl.searchParams.get('tenant');
        if (tenant) {
          this.initialize({ tenant });
        }
      }
    }
  }

  private openStartForm() {
    this.startRef?.value?.setAttribute('data-show', 'true');
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'false');
    this.feedbackFormRef?.value?.setAttribute('data-show', 'false');
    this.lastFocusableElement = this.feedbackStartCloseButton;
    this.firstFocusableElement = this.feedbackStartCloseImg;
    document.addEventListener('keydown', this.trapTabKey);
    document.addEventListener('keydown', this.handleEscapeKey);
    document.body.classList.add('modal-open');
    this.onDimChange(true);
  }

  private handleKeyOpenStartForm(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openStartForm();
    }
  }

  private handleKeyHowEasy(event: KeyboardEvent, index: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectRating(index);
    }
  }
  private handleKeyExit(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.closeFeedbackForm();
    }
  }

  private closeStartForm(event: Event) {
    event.preventDefault();
    this.startRef?.value?.setAttribute('data-show', 'false');
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'false');
    this.feedbackFormRef?.value?.setAttribute('data-show', 'true');
    this.firstFocusableElement = this.feedbackFormCloseImg;
    this.lastFocusableElement = this.cancelButtonRef;

    document.addEventListener('keydown', this.trapTabKey);
    document.addEventListener('keydown', this.handleEscapeKey);
    this.feedbackFormClassRef?.value?.setAttribute('style', 'height:65vh;max-height:560px');
    this.technicalCommentDivRef?.value?.setAttribute('style', 'display:none');

    this.feedbackContentFormRef.value?.scrollTo(0, 0);
  }

  trapTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // If Shift + Tab
        if (document.activeElement === this.firstFocusableElement?.value) {
          e.preventDefault();
          this.lastFocusableElement!.value?.focus();
        }
      } else {
        // If Tab
        if (document.activeElement === this.lastFocusableElement?.value) {
          e.preventDefault();
          this.firstFocusableElement!.value?.focus();
        }
      }
    }
  };

  handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.reset();
      this.feedbackBadgeRef?.value?.setAttribute('data-show', 'true');
      this.feedbackFormRef?.value?.setAttribute('data-show', 'false');
      this.startRef?.value?.setAttribute('data-show', 'false');
      this.onDimChange(false);
      document.body.classList.remove('modal-open');
    }
  };

  private closeFeedbackForm() {
    this.reset();
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'true');
    this.feedbackFormRef?.value?.setAttribute('data-show', 'false');
    this.startRef?.value?.setAttribute('data-show', 'false');
    this.onDimChange(false);
    document.body.classList.remove('modal-open');
  }
  private closeErrorForm() {
    this.closeFeedbackForm();
    this.feedbackFormRef?.value?.setAttribute('data-error', 'false');
    this.reset();
    document.body.classList.remove('modal-open');
  }
  private closeAllFeedback() {
    this.closeFeedbackForm();
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'false');
    this.reset();
    document.body.classList.remove('modal-open');
  }

  private onIssueChange(event: Event) {
    if (event.target instanceof HTMLInputElement && this.feedbackFormRef.value) {
      if (this.ratingSelector.value) {
        this.ratingSelector.value.classList.remove('error');
      }
      if (this.commentSelector.value) {
        this.commentSelector.value.classList.remove('error');
      }
      if (this.issueSelectionErrorText.value) {
        this.issueSelectionErrorText.value.classList.remove('visible');
      }
      if (event.target.value.toLowerCase() === 'yes') {
        if (this.ratingSelector.value) {
          this.ratingSelector.value.checked = true;
        }
        this.technicalCommentDivRef?.value?.setAttribute('style', 'display:block');

        this.technicalCommentRef.value?.focus();
      } else {
        if (this.commentSelector.value) {
          this.commentSelector.value.checked = true;
        }

        this.feedbackContentFormRef?.value?.setAttribute('style', 'padding-top:36px');
        this.technicalCommentDivRef?.value?.setAttribute('style', 'display:none');
        if (this.technicalCommentDivRef?.value) {
          this.technicalCommentDivRef?.value?.removeAttribute('value');
        }
      }
    }
  }

  handleRadioKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (this.commentSelector.value) {
        if (this.commentSelector.value.checked === false) {
          this.commentSelector.value.focus();
          this.commentSelector.value.checked = true;
          this.technicalCommentDivRef?.value?.setAttribute('style', 'display:none');
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (this.ratingSelector.value) {
        if (this.ratingSelector.value.checked === false) {
          this.ratingSelector.value.focus();
          this.ratingSelector.value.checked = true;
          this.technicalCommentRefOnChange();
        }
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.onIssueChange(e);
    }
  };

  private onDimChange(isDim: boolean) {
    if (isDim) {
      if (this.dimRef.value) {
        this.dimRef.value.style.visibility = 'visible';
      }
    } else {
      if (this.dimRef.value) {
        this.dimRef.value.style.visibility = 'hidden';
      }
    }
  }

  private selectedRating: number = -1;

  private reset() {
    this.defaultRating();
    this.selectedRating = -1;
    if (this.commentRef.value) {
      this.commentRef.value.value = '';
    }
    if (this.technicalCommentRef?.value) {
      this.technicalCommentRef.value.value = '';
    }
    if (this.ratingSelector.value) {
      this.ratingSelector.value.checked = false;
    }
    if (this.commentSelector.value) {
      this.commentSelector.value.checked = false;
    }
    if (this.ratingErrorText.value) {
      this.ratingErrorText.value.classList.remove('visible');
    }
    if (this.issueSelectionErrorText.value) {
      this.issueSelectionErrorText.value.classList.remove('visible');
    }
    if (this.ratingSelector.value) {
      this.ratingSelector.value.classList.remove('error');
    }
    if (this.commentSelector.value) {
      this.commentSelector.value.classList.remove('error');
    }
    if (this.technicalCommentRef) {
      this.technicalCommentRef.value?.classList.remove('error');
    }
    if (this.technicalCommentErrorText.value) {
      this.technicalCommentErrorText.value.classList.remove('visible');
    }
    this.feedbackContentFormRef?.value?.setAttribute('style', 'padding-top:36px');
  }
  private validateRadioSelection(): boolean {
    const isYesChecked = this.ratingSelector.value && this.ratingSelector.value.checked;
    const isNoChecked = this.commentSelector.value && this.commentSelector.value.checked;

    if (!isYesChecked && !isNoChecked) {
      this.issueSelectionErrorText.value && this.issueSelectionErrorText.value.classList.add('visible');
      this.ratingSelector.value && this.ratingSelector.value.classList.add('error');
      this.commentSelector.value && this.commentSelector.value.classList.add('error');
      return false;
    } else {
      this.ratingSelector.value && this.ratingSelector.value.classList.remove('error');
      this.commentSelector.value && this.commentSelector.value.classList.remove('error');
      this.issueSelectionErrorText.value && this.issueSelectionErrorText.value.classList.remove('visible');
      return true;
    }
  }
  private validateRating(): boolean {
    if (this.selectedRating === -1) {
      if (this.ratingErrorText.value) {
        this.ratingErrorText.value.classList.add('visible');
        this.errorsOnRating(true);
      }

      return false;
    } else {
      if (this.ratingErrorText.value) {
        this.ratingErrorText.value.classList.remove('visible');
        this.errorsOnRating(false);
      }
      return true;
    }
  }

  private validateTechnicalComment(): boolean {
    const technicalIssueYesChecked = this.ratingSelector.value && this.ratingSelector.value.checked;
    if (technicalIssueYesChecked) {
      if (!this.technicalCommentRef.value || this.technicalCommentRef.value.value.length === 0) {
        if (this.technicalCommentErrorText.value) this.technicalCommentErrorText.value.classList.add('visible');
        if (this.technicalCommentRef.value) {
          this.technicalCommentRef.value.classList.add('error');
        }
        return false;
      }
    }
    return true;
  }

  private validateForm() {
    let isValid = true;
    if (!this.validateRating()) isValid = false;
    if (!this.validateRadioSelection()) isValid = false;
    if (!this.validateTechnicalComment()) isValid = false;
    return isValid;
  }

  private async sendFeedback(event: Event) {
    event.preventDefault();

    const isValidForm = this.validateForm();
    if (isValidForm) {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      const token = this.getAccessToken ? await this.getAccessToken() : undefined;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const context = await this.getContext();

      const comment = this.commentRef.value?.value || undefined;
      const technicalIssue = this.technicalCommentRef?.value?.value || undefined;

      const rating = this.ratings[this.selectedRating].rate;
      const request: Record<string, unknown> = { context, rating, comment, technicalIssue };

      if (this.tenant) {
        request.tenant = this.tenant;
      }

      if (this.apiUrl) {
        try {
          const response = await fetch(this.apiUrl.href, {
            headers,
            method: 'POST',
            body: JSON.stringify(request),
          });
          this.firstFocusableElement = this.feedbackFormCloseImg;
          if (!response.ok) {
            console.log(`Response received for sending feedback to API not 200: ${response.status}`);
            this.feedbackFormRef?.value?.setAttribute('data-error', 'true');

            this.lastFocusableElement = this.feedbackCloseErrorButton;
          } else {
            this.feedbackFormRef.value?.setAttribute('data-completed', 'true');
            this.lastFocusableElement = this.feedbackCloseSuccessButton;
          }
        } catch (err) {
          console.log(`Error encountered sending feedback to API: ${err}`);

          this.feedbackFormRef?.value?.setAttribute('data-error', 'true');
          this.lastFocusableElement = this.feedbackCloseErrorButton;
        }
        this.feedbackContentFormRef.value?.scrollTo(0, 0);
        this.feedbackFormClassRef?.value?.setAttribute('style', 'max-height:560px');
      }
    } else {
      this.feedbackContentFormRef?.value?.setAttribute('style', 'padding-top:0px');
      if (!this.validateRating()) {
        this.feedbackContentFormRef.value?.scrollTo(0, 0);
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderRating = (rating: any, index: number) => {
    return html`
      <div class="rating-div">
        <img
          src="${rating.svgDefault}"
          @mouseover="${() => this.updateHover(index, true)}"
          @mouseout="${() => this.updateHover(index, false)}"
          @click="${() => this.selectRating(index)}"
          @keydown=${(event: KeyboardEvent) => this.handleKeyHowEasy(event, index)}
          class="rating"
          alt="${rating.label}"
          tabindex="0"
          aria-label="${rating.label}"
        />

        <p
          class="ratingText"
          @mouseover="${() => this.updateHover(index, true)}"
          @mouseout="${() => this.updateHover(index, false)}"
          @click="${() => this.selectRating(index)}"
        >
          ${rating.label}
        </p>
        <span class="tooltip-text">${rating.label}</span>
      </div>
    `;
  };
  private updateHover = (index: number, isHovering: boolean) => {
    const isSmallScreen = window.matchMedia('(max-width: 640px)').matches;
    const rating = this.ratings[index];
    const images = document.querySelectorAll('.rating');
    const image = images[index] as HTMLImageElement;
    image.src =
      isHovering && this.selectedRating !== index
        ? rating.svgHover
        : this.selectedRating === index
        ? rating.svgClick
        : rating.svgDefault;

    const texts = document.querySelectorAll('.ratingText');
    const text = texts[index] as HTMLImageElement;
    text.style.color = isHovering ? '#004F84' : this.selectedRating === index ? '#0081A2' : '#333333';
    if (!isSmallScreen) {
      const tooltips = document.querySelectorAll('.tooltip-text');
      const tooltip = tooltips[index] as HTMLImageElement;
      tooltip.style.visibility = isHovering ? 'visible' : 'hidden';
      tooltip.style.opacity = isHovering ? '1' : '0';
      if (index === 0) {
        tooltip.style.marginLeft = '35px';
        tooltip.classList.add('modified');
      }
    }
  };

  private clearRating = (index: number) => {
    if (index > -1) {
      const rating = this.ratings[index];
      const images = document.querySelectorAll('.rating');
      const image = images[index] as HTMLImageElement;
      image.src = rating.svgDefault;

      const texts = document.querySelectorAll('.ratingText');
      const text = texts[index] as HTMLImageElement;
      text.style.color = '#333333';
    }
  };
  private defaultRating = () => {
    for (let i = 0; i < this.ratings.length; i++) {
      const rating = this.ratings[i];
      const images = document.querySelectorAll('.rating');
      const image = images[i] as HTMLImageElement;

      image.src = rating.svgDefault;
    }
  };
  private errorsOnRating = (isError: boolean) => {
    for (let i = 0; i < this.ratings.length; i++) {
      const rating = this.ratings[i];
      const images = document.querySelectorAll('.rating');
      const image = images[i] as HTMLImageElement;
      if (isError) {
        image.src = rating.svgError;
      } else {
        if (this.selectedRating === i) {
          image.src = rating.svgClick;
        } else {
          image.src = rating.svgDefault;
        }
      }
    }
  };
  private technicalCommentRefOnChange = () => {
    if (
      this.technicalCommentRef?.value &&
      this.technicalCommentRef?.value?.value.length > 0 &&
      this.technicalCommentErrorText.value
    ) {
      this.technicalCommentErrorText.value.classList.remove('visible');
      this.technicalCommentRef.value.classList.remove('error');
    }
  };

  private selectRating = (index: number) => {
    this.errorsOnRating(false);
    if (this.ratingErrorText.value) {
      this.ratingErrorText.value.classList.remove('visible');
    }

    this.updateHover(index, false);
    const images = document.querySelectorAll('.rating');
    const ratingNew = this.ratings[index];
    const imageNew = images[index] as HTMLImageElement;
    imageNew.src = ratingNew.svgClick;
    if (this.selectedRating !== -1) {
      const rating = this.ratings[this.selectedRating];
      const image = images[this.selectedRating] as HTMLImageElement;
      image.src = rating.svgDefault;
      const texts = document.querySelectorAll('.ratingText');
      const text = texts[this.selectedRating] as HTMLImageElement;
      text.style.color = '#333333';
    }
    this.selectedRating = index;
    this.lastFocusableElement = this.sendButtonRef;
    const texts = document.querySelectorAll('.ratingText');
    const text = texts[index] as HTMLImageElement;
    text.style.color = '#0081A2';
  };

  public openFeedbackForm() {
    this.openStartForm();
  }

  public initialize({ apiUrl, tenant, name, email, getAccessToken, getContext }: FeedbackOptions) {
    if (apiUrl && typeof apiUrl === 'string') {
      this.apiUrl = new URL(apiUrl);
    }

    if (!this.apiUrl) {
      throw new Error('API URL is not specified and cannot be determined implicitly.');
    }

    if (tenant && typeof tenant === 'string') {
      this.tenant = tenant;
    }

    if (typeof getAccessToken === 'function') {
      this.getAccessToken = getAccessToken;
    }

    if (!this.getAccessToken && !this.tenant) {
      throw new Error('Either tenant or getAccessToken must be specified to determine tenant context of feedback.');
    }

    if (typeof getContext === 'function') {
      this.getContext = getContext;
    }
    if (this.name) {
      this.name = name;
    }
    if (this.email) {
      this.email = email;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const head = document.querySelector('head');
    if (head) {
      render(
        html`<style>
          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black */
            z-index: 1000; /* Ensure it overlays other content */
            visibility: hidden;
          }
          img:focus-visible {
            border-radius: 0.25rem;
            outline: #feba35 solid 3px;
          }
          body.modal-open {
            overflow: hidden;
          }
          .feedback-close-button:hover,
          .feedback-close-button:active,
          .feedback-close-button:focus {
            background-color: #f1f1f1;
            border-radius: 0.25rem;
          }

          .feedback-close-button:active {
            transform: translateY(2px);
          }

          .adsp-fb {
            z-index: 999;
            font-family: acumin-pro-semi-condensed, helvetica-neue, arial, sans-serif;
            line-height: var(--goa-line-height-2);
            font-size: var(--goa-font-size-4);
          }
          .adsp-fb h3 {
            margin-top: 0px !important;
          }
          .adsp-fb > *[data-show]:not([data-show='true']) {
            display: none;
          }
          .adsp-fb .adsp-fb-badge {
            z-index: 10;
            background: #0081a2;
            color: #ffffff;
            position: fixed;
            right: 0;
            top: 60vh;
            padding: 16px 8px;
            writing-mode: vertical-rl;
            cursor: pointer;
            border-radius: 0 0.25rem 0.25rem 0;
            transform: rotate(-180deg);
            display: block;
          }
          .adsp-fb .adsp-fb-badge:hover {
            border-color: #004f84;
            background-color: #004f84;
          }
          .adsp-fb .adsp-fb-badge:focus {
            border-color: #004f84;
            background-color: #004f84;
          }

          .adsp-fb .adsp-fb-badge:active {
            outline: initial;
            box-shadow: 0 0 0 3px #feba35;
          }

          .adsp-fb .adsp-fb-badge:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px #feba35;
          }

          .adsp-fb .adsp-fb-form-container {
            z-index: 2;
            position: fixed;
            background: #ffffff;
            width: 640px;
            left: 50%;
            top: 10vh;
            border: 1px solid;
            border-radius: 3px;
            transform: translateX(-50%);
            max-height: 100%;
            height: min-content;
            overflow: hidden;
          }
          .adsp-fb .adsp-fb-container-heading {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding-right: 20px;
            padding-left: 1.25rem;
            align-items: center;
            height: 74px;
            > img {
              cursor: pointer;
            }
          }
          .adsp-fb .adsp-fb-form {
            display: flex;
            box-sizing: border-box;
            flex-direction: column;
            padding: 0 0 24px 24px;
            transition: transform 0.001ms;
          }
          .adsp-fb .adsp-fb-content {
            max-height: 465px;
            overflow-y: auto;
            overflow-x: hidden;
            flex: 1;
            padding-right: 16px;
            padding-top: 36px;
            margin-bottom: 4px;
            padding-bottom: 0px !important;
          }
          .adsp-fb .adsp-fb-form-rating {
            display: flex;
            flex-direction: row;
            gap: 32px;
            border: 0;
            margin-top: 12px;
            justify-content: space-between;
            width: 98%;

            > div > img {
              width: 46px;
              height: 46px;
            }
            > div > img:first-child {
              padding-left: 0px;
            }
          }
          .tooltip-text {
            visibility: hidden;
            margin-left: 25px;
            background-color: #666666;
            color: #fff;
            text-align: center;
            border-radius: 5px;
            padding: 8px 12px;
            margin-top: 53px;
            position: absolute;
            transform: translateX(-50%);
            -webkit-transform: translateX(-50%);
            white-space: nowrap;
            opacity: 0;
            z-index: 2;
            transition: opacity 0.3s;
            -webkit-transition: opacity 0.3s;
          }
          .tooltip-text:before {
            content: '';
            position: absolute;
            top: -10px;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            transform: translateX(-50%);
            -webkit-transform: translateX(-50%);
            border-color: transparent transparent #666666 transparent;
          }
          .tooltip-text.modified:before {
            left: 40%;
          }
          .ratingText {
            display: none;
          }
          .adsp-fb .adsp-fb-form-comment {
            display: flex;
            flex-direction: column;
            margin-bottom: 12px;
            > label {
              margin-top: 32px;
            }
          }
          .adsp-fb .adsp-fb-form-comment span {
            color: var(--color-gray-600);
            font-size: 14px;
          }

          .adsp-fb .adsp-fb-form-comment textarea {
            margin-top: 12px;
            margin-left: 3px;
            resize: none;
            min-height: 100px;
            width: 98%;
            border-radius: 3px;
            cursor: text;
            padding: 10px 8px;
            box-sizing: border-box;
            outline: none;
          }
          .adsp-fb .adsp-fb-form-comment textarea:hover {
            box-shadow: 0 0 0 var(--goa-border-width-m) var(--goa-color-interactive-hover);
          }
          .adsp-fb .adsp-fb-form-comment textarea:focus {
            box-shadow: 0 0 0 3px var(--goa-color-interactive-focus);
          }
          .adsp-fb .adsp-fb-form-comment textarea.error {
            box-shadow: 0 0 0 var(--goa-border-width-m) red;
            border: 1px solid red;
          }
          .adsp-fb .adsp-fb-form-comment textarea::placeholder {
            text-align: right;
            position: absolute;
            bottom: 10px;
            right: 16px;
          }

          .adsp-fb .adsp-fb-actions,
          .adsp-fb .adsp-fb-success-actions {
            display: flex;
            padding-right: 24px;
            margin-top: 24px;
          }
          .adsp-fb .adsp-fb-success-actions {
            padding-right: 0px;
          }

          .adsp-fb button {
            display: inline-flex;
            cursor: pointer;
            border-radius: 0.25rem;
            box-sizing: border-box;
            font-size: 1.25rem;
            font-weight: 400;
            height: 2.625rem;
            line-height: 100%;
            padding: 0 0.75rem;
            gap: 0.5rem;
            align-items: center;
            justify-content: center;
            border: 2px solid #0070c4;
            color: #0070c4;
          }
          .adsp-fb button:active {
            transform: translateY(2px);
          }

          .adsp-fb button:first-child {
            margin-left: auto !important;
          }
          .adsp-fb button.adsp-fb-form-primary {
            border: 2px solid #0070c4;
            margin-left: 24px;
            background: #0070c4;
            color: #ffffff;
          }

          .adsp-fb button.adsp-fb-form-primary:focus-visible {
            border-radius: 0.25rem;
            box-shadow: 0 0 0 3px #feba35;
            outline: #feba35 solid 1px;
          }

          .adsp-fb button:hover {
            border-color: #004f84;
            background-color: #004f84;
          }

          .adsp-fb button:focus:active {
            border-color: #004f84;
            background-color: #004f84;
            box-shadow: 0 0 0 3px #feba35;
          }

          .adsp-fb button[disabled] {
            pointer-events: none;
            opacity: 0.5;
          }

          .adsp-fb button.adsp-fb-form-secondary {
            border: 2x solid #0070c4;
            background-color: #ffffff;
            color: #0070c4;
          }
          .adsp-fb button.adsp-fb-form-secondary:focus-visible {
            border-radius: 0.25rem;
            box-shadow: 0 0 0 3px #feba35;
            outline: #feba35 solid 1px;
          }

          .adsp-fb button.adsp-fb-form-secondary:hover {
            border-color: #004f84;
            color: #004f84;
            background-color: #f1f1f1;
          }
          .adsp-fb button.adsp-fb-form-secondary:focus,
          .adsp-fb button.adsp-fb-form-secondary:active {
            border-color: #004f84;
            background-color: #f1f1f1;
            border-radius: 0.25rem;
            border: 1px solid #004f84;
          }

          .adsp-fb .adsp-fb-message {
            position: absolute;
            visibility: hidden;
            top: 0;
            right: 0;
            height: 100%;
            width: 100%;
            transition: transform 200ms;
            transform: translateX(100%);
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            padding: 24px 24px;
          }
          .adsp-fb .rating-div {
            display: flex;
            flex-direction: column;
            padding-left: 2px;
          }
          .adsp-fb .adsp-fb-sent {
            text-align: left;
          }
          .adsp-fb .adsp-fb-error {
            text-align: center;
          }
          .adsp-fb .adsp-fb-sent .adsp-fb-error .adsp-fb-actions {
            margin-top: auto;
          }

          .adsp-fb .adsp-fb-form-container[data-completed='true'] .adsp-fb-form {
            transform: translateX(-100%);
            visibility: hidden;
            height: 264px;
          }
          .adsp-fb .adsp-fb-form-container[data-error='true'] .adsp-fb-form {
            transform: translateX(-100%);
            visibility: hidden;
            height: 334px;
          }
          .adsp-fb .adsp-fb-form-container[data-completed='true'] .adsp-fb-sent {
            visibility: visible;
            transition: visibility 0s 0.1s;
          }

          .adsp-fb .adsp-fb-form-container[data-error='true'] .adsp-fb-error {
            visibility: visible;
            transition: visibility 0s 0.1s;
          }
          .radios {
            margin-top: 16px;
            margin-bottom: 16px;
            display: flex;
            flex-direction: row;
          }
          .radio-span {
            display: flex;
            align-items: center;
          }
          .radio-span:focus-visible {
            border-radius: 0.25rem;
            border: 1px solid #feba35;
            outline: #feba35 solid 1px;
          }
          .rating {
            cursor: pointer;
            transform: translateZ(0);
            will-change: transform, color;
            transition: transform 0.3s ease-in-out color 0.3s ease;
            transition: -webkit-transform 0.3s ease-in-out, color 0.3s ease;
          }

          .title {
            font-weight: 700;
            line-height: 24px;
            text-align: left;
            margin-bottom: 0px;
          }

          .help-text {
            margin-top: 4px;
            margin-bottom: 12px;
            line-height: 28px;
          }
          .radio-container {
            display: flex;
            flex-direction: column;
            cursor: pointer;
          }
          .radio-container span {
            color: var(--color-gray-600);
            font-size: 14px;
          }
          .radio {
            appearance: none;
            width: 24px;
            height: 24px;
            border: 2px solid #ccc;
            border-radius: 50%;
            position: relative;
            background-color: #fff;
            transition: box-shadow 100ms ease-in-out;
            cursor: pointer;
          }
          .radio *,
          .radio *:before,
          .radio *:after {
            box-sizing: border-box;
          }

          .radio::not(:checked) {
            border: 1px solid #666666;
          }

          .radio:checked:hover {
            border: 7px solid #004f84;
            box-shadow: 0 0 0 1px #004f84;
          }

          .radio:hover,
          .radio:focus-visible,
          .radio:focus:active {
            outline: initial;
            border: 1px solid #004f84;
            box-shadow: 0 0 0 1px #004f84;
          }

          .radio:hover:active,
          .radio:hover:focus {
            box-shadow: 0 0 0 3px #feba35;
          }

          .radio:checked {
            border: 7px solid #0070c4;
          }
          .radio.error {
            border: 1px solid red;
            box-shadow: 0 0 0 1px red;
          }
          .radio-label {
            padding: 0 8px;
            font-weight: normal;
            cursor: pointer;
          }
          .errorText {
            color: #333333;
            font-size: 18px;
          }
          .successButton {
            margin-top: 24px;
          }

          .styled-hr {
            border: none;
            height: 1px;
            background-color: #ccc;
            margin: 0;
          }

          /* Top-facing shadow */
          .styled-hr-top {
            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
          }

          /* Bottom-facing shadow */
          .styled-hr-bottom {
            box-shadow: -2px -3px 3px rgba(0, 0, 0, 0.1);
          }

          .hr-width {
            width: 98%;
            margin: 0;
          }
          .full-width-hr-container {
            margin-left: -24px;
          }

          .p-error {
            margin-left: 36px;
            margin-right: 36px;
            line-height: 28px;
          }
          .h3-sub-title {
            padding-top: 36px !important;
            margin-top: 0;
          }
          .h3-success {
            margin-top: 0;
          }
          .p-content {
            line-height: 28px;
            > a,
            > a:link,
            > a:visited {
              color: #0070c4;
            }
          }
          .inline-error {
            display: none;
            align-items: center;
            color: red;
            gap: 0.5rem;
          }
          .inline-error.visible {
            display: flex;
            visibility: visible;
          }
          .inline-error p {
            margin: 0;
            color: red;
          }
          @media screen and (max-width: 767px) {
            .adsp-fb div.adsp-fb-form-container {
            }
            .adsp-fb .adsp-fb-badge {
              top: auto;
              bottom: 12vh;
              font-size: 12px;
              padding: 12px 0;
              line-height: 1.5rem;
            }
          }
          @media screen and (max-width: 640px) {
            .adsp-fb .adsp-fb-form-container[data-completed='true'] .adsp-fb-form {
              height: 320px;
            }
            .adsp-fb .adsp-fb-form-container[data-error='true'] .adsp-fb-form {
              height: 350px;
            }
            .adsp-fb div.adsp-fb-form-container {
              bottom: 0;
              border: 0;
              width: 100%;
              top: auto;
              max-height: 100%;
              overflow-x: hidden;
            }
            .adsp-fb-main {
              overflow-y: auto;
            }
            .adsp-fb .adsp-fb-content {
              margin-bottom: 0px;
              padding-top: 24px;
            }

            .adsp-fb .adsp-fb-actions {
              bottom: 0;
              margin-top: 0px;
              flex-direction: column-reverse;
              > button {
                width: 100%;
                margin-top: 12px;
              }
            }
            .adsp-fb button.adsp-fb-form-primary {
              margin-left: 0;
            }
            .adsp-fb .adsp-fb-container-heading {
              height: 55px !important;
            }
            .adsp-fb .rating-div {
              flex-direction: row;
              gap: 6px;
            }
            .adsp-fb .adsp-fb-form-rating {
              flex-direction: column-reverse;
              gap: 16px;

              > div {
                display: flex;
                flex-direction: row;
                align-items: center;
              }
              > div > img {
                height: 32px;
                padding-right: 8px;
              }
            }
            tooltip-text {
              visibility: hidden;
              opacity: 0;
            }
            .ratingText {
              padding-top: 12px;
              cursor: pointer;
              margin-bottom: 0px !important;
              display: block;
              padding: 0;
            }
            .ratingText :hover {
              color: #004f84;
            }
          }
          @media screen and (max-height: 800px) {
            .adsp-fb .adsp-fb-form-container {
              top: 16px;
            }
          }
        </style>`,
        head
      );
    }

    const body = document.querySelector('body');
    if (body) {
      render(
        html`
          <div>
            <div class="adsp-fb">
              <div
                tabindex="0"
                ${ref(this.feedbackBadgeRef)}
                class="adsp-fb-badge"
                data-show="true"
                @click=${this.openStartForm}
                @keydown=${this.handleKeyOpenStartForm}
                aria-label="Feedback badge"
              >
                <span>Feedback</span>
              </div>
            </div>
            <div ${ref(this.dimRef)} class="overlay">
              <div class="adsp-fb">
                <div ${ref(this.startRef)} class="adsp-fb-form-container adsp-fb-start" data-show="false">
                  <div class="adsp-fb-container-heading">
                    <h3 class="title">Give feedback</h3>
                    <img
                      ${ref(this.feedbackStartCloseImg)}
                      class="feedback-close-button"
                      tabindex="0"
                      src=${closeOutlineSvg}
                      width="30px"
                      height="30px"
                      @click="${this.closeFeedbackForm}"
                      @keydown=${this.handleKeyExit}
                      alt="close feedback"
                      aria-label="Close feedback image"
                    />
                  </div>
                  <hr class="styled-hr styled-hr-top" />
                  <form class="adsp-fb-form">
                    <h3 class="h3-sub-title">Tell us what you think</h3>
                    <p class="p-content">
                      Please help us improve our service by sharing feedback about your experience. This will only take
                      a minute.
                    </p>
                    <div class="adsp-fb-actions">
                      <button
                        ${ref(this.feedbackStartCloseButton)}
                        class="adsp-fb-form-primary"
                        id="start"
                        @click=${this.closeStartForm}
                        type="submit"
                        tabindex="0"
                        aria-label="Start feedback button"
                      >
                        Start
                      </button>
                    </div>
                  </form>
                </div>

                <div ${ref(this.feedbackFormRef)} class="adsp-fb-form-container adsp-fb-main" data-show="false">
                  <div class="adsp-fb-container-heading">
                    <h3 class="title">Give feedback</h3>
                    <img
                      class="feedback-close-button"
                      ${ref(this.feedbackFormCloseImg)}
                      tabindex="0"
                      src=${closeOutlineSvg}
                      width="30px"
                      height="30px"
                      @click="${this.closeFeedbackForm}"
                      @keydown=${this.handleKeyExit}
                      alt="close feedback"
                      aria-label="Close feedback image"
                    />
                  </div>
                  <hr class="styled-hr styled-hr-top" />
                  <form ${ref(this.feedbackFormClassRef)} class="adsp-fb-form">
                    <div ${ref(this.feedbackContentFormRef)} class="adsp-fb-content">
                      <label
                        ><b>How easy was it for you to use this service? <br /></b>
                      </label>
                      <div class="adsp-fb-form-rating" ${ref(this.ratingRef)}>
                        ${this.ratings.map((rating, index) => this.renderRating(rating, index))}
                      </div>
                      <span class="inline-error" ${ref(this.ratingErrorText)} style="padding-top: 4px">
                        <img src=${goaErrorIconSvg} alt="Error in rating" />
                        <p>Select an option</p>
                      </span>
                      <div class="adsp-fb-form-comment">
                        <label><b>Do you have any additional comments?</b> <span>(optional)</span></label>
                        <textarea
                          id="comment"
                          ${ref(this.commentRef)}
                          placeholder=""
                          aria-label="Comments textarea"
                        ></textarea>
                        <span class="help-text"
                          >Do not include personal information like SIN, password, addresses, etc.</span
                        >
                      </div>
                      <hr class="hr-width" />
                      <br />
                      <div class="radio-container">
                        <label><b>Did you experience any technical issues?</b></label>
                        <div class="radios" @change=${this.onIssueChange}>
                          <div id="technicalIssueYes" class="radio-span">
                            <input
                              tabindex="0"
                              name="YesOrNo"
                              type="radio"
                              id="yes"
                              value="Yes"
                              class="radio"
                              ${ref(this.ratingSelector)}
                              aria-label="Yes"
                              @keydown=${(e: KeyboardEvent) => {
                                this.handleRadioKeyDown(e);
                              }}
                            />
                            <label for="yes" class="radio-label"> Yes </label>
                          </div>
                          <div class="radio-span">
                            <input
                              tabindex="0"
                              name="YesOrNo"
                              type="radio"
                              id="no"
                              value="No"
                              class="radio"
                              ${ref(this.commentSelector)}
                              aria-label="No"
                              @keydown=${(e: KeyboardEvent) => {
                                this.handleRadioKeyDown(e);
                              }}
                            />

                            <label for="no" class="radio-label"> No </label>
                          </div>
                        </div>
                        <span class="inline-error" ${ref(this.issueSelectionErrorText)}>
                          <img src=${goaErrorIconSvg} alt="Error in issue selection" />
                          <p>Select an option</p></span
                        >
                        <div ${ref(this.technicalCommentDivRef)} class="adsp-fb-form-comment">
                          <label
                            ><b
                              >Please describe the issue in detail. Mention the page or step where you experienced the
                              issue, if applicable.</b
                            >
                          </label>
                          <textarea
                            ${ref(this.technicalCommentRef)}
                            id="technicalComment"
                            @input=${this.technicalCommentRefOnChange}
                            aria-label="Technical comments textarea"
                          ></textarea>
                          <span class="inline-error" ${ref(this.technicalCommentErrorText)}>
                            <img src=${goaErrorIconSvg} alt="Error in technical comment" />
                            <p>Please explain the issue you encountered in detail</p></span
                          >
                          <span class="help-text"
                            >Do not include personal information like SIN, password, addresses, etc.</span
                          >

                          <br />
                        </div>
                      </div>
                    </div>
                    <div class="full-width-hr-container">
                      <hr class="styled-hr styled-hr-bottom" />
                    </div>
                    <div class="adsp-fb-actions">
                      <button
                        ${ref(this.cancelButtonRef)}
                        @click=${this.closeFeedbackForm}
                        class="adsp-fb-form-secondary"
                        type="button"
                        tabindex="0"
                        aria-label="Close feedback button"
                      >
                        Cancel
                      </button>
                      <button
                        ${ref(this.sendButtonRef)}
                        class="adsp-fb-form-primary"
                        @click=${this.sendFeedback}
                        type="submit"
                        tabindex="0"
                        aria-label="Submit feedback button"
                      >
                        Submit
                      </button>
                    </div>

                    <div class="adsp-fb-sent adsp-fb-message">
                      <h3 class="h3-success">
                        Success!
                        <img src=${greenCircleCheckmarkSvg} width="18px" height="18px" alt="Success" />
                      </h3>
                      <p class="p-content">
                        Thank you for providing your feedback. We will use your input to improve the service. You will
                        not receive a response from this submission. If you do require a response, you can contact
                        government through
                        <a target="_blank" href="https://www.alberta.ca/contact-government"
                          >Alberta Connects
                          <img
                            class="connect-icon"
                            src=${openLinkSvg}
                            width="18px"
                            height="18px"
                            alt="Open Alberta Connects"
                        /></a>
                      </p>
                      <div class="adsp-fb adsp-fb-success-actions">
                        <button
                          @click=${this.closeAllFeedback}
                          ${ref(this.feedbackCloseSuccessButton)}
                          id="feedback-close-success"
                          class="adsp-fb-form-primary"
                          type="button"
                          tabindex="0"
                          aria-label="Close feedback success button"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    <div class="adsp-fb-error adsp-fb-message">
                      <div>
                        <img src=${errorIconSvg} width="50px" height="50px" alt="Error" />
                      </div>
                      <div class="errorText">Error 500</div>
                      <div>
                        <img src=${blueUnderLineSvg} width="50px" alt="Blue Line" />
                        <div>
                          <h3>We are experiencing a problem</h3>
                          <p class="p-error">
                            we are experiencing an issue trying to load this page. Please try again in a few minutes. We
                            apologize for the inconvenience.
                          </p>
                          <div>
                            <button
                              ${ref(this.feedbackCloseErrorButton)}
                              @click=${this.closeErrorForm}
                              class="adsp-fb-form-primary"
                              id="feedback-close-error"
                              type="button"
                              tabindex="0"
                              aria-label="Close feedback error button"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        `,
        body,
        { host: this }
      );
    }
  }
}

const adspFeedback = new AdspFeedback();

// This is to support the development scaffold.
// Consuming apps should include non-module script element which will import and set global variable.
window.adspFeedback = adspFeedback;

export default adspFeedback;
