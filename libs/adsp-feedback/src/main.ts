import { html, render } from 'lit-html';
import { ref, createRef, Ref } from 'lit-html/directives/ref.js';
import { AdspFeedback as AdspFeedbackApi, FeedbackContext, FeedbackOptions } from './types';

import blueUnderLineSvg from './assets/Blue-Underline.svg';
import closeOutlineSvg from './assets/close-outline.svg';
import errorIconSvg from './assets/Error_Icon.svg';
import greenCircleCheckmarkSvg from './assets/green-circle-checkmark.svg';
import openLinkSvg from './assets/Open-Link.svg';
import goaErrorIconSvg from './assets/goa-error-icon.svg';
import { feedbackStyles } from './feedback.styles';

import { ratings } from './ratings';

type DesignSystemsVersion = '1.0' | '2.0';

export class AdspFeedback implements AdspFeedbackApi {
  private tenant?: string;
  private apiUrl?: URL;
  private getAccessToken?: () => Promise<string>;
  private getContext: () => Promise<FeedbackContext>;
  private designSystemsVersion: DesignSystemsVersion = '1.0';

  private readonly MAX_CHAR_LIMIT = 1000;
  private readonly CHAR_LIMIT_WARNING = 'Please limit your text to 1000 characters.';

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
  private rootRef: Ref<HTMLDivElement> = createRef();

  private ratingErrorText: Ref<HTMLSpanElement> = createRef();
  private issueSelectionErrorText: Ref<HTMLSpanElement> = createRef();
  private technicalCommentErrorText: Ref<HTMLSpanElement> = createRef();
  private commentCharCountRef: Ref<HTMLSpanElement> = createRef();
  private commentWarningRef: Ref<HTMLSpanElement> = createRef();
  private techCharCountRef: Ref<HTMLSpanElement> = createRef();
  private techWarningRef: Ref<HTMLSpanElement> = createRef();

  private ratings = ratings;
  private previousBodyOverflow?: string;

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
          this.initialize({
            tenant,
            designSystemsVersion: scriptUrl.searchParams.get('designSystemsVersion') ?? undefined,
          });
        }
      }
    }
  }

  private getWidgetElements<T extends Element>(selector: string): NodeListOf<T> {
    return (this.rootRef.value ?? document).querySelectorAll<T>(selector);
  }

  private normalizeDesignSystemsVersion(version?: string): DesignSystemsVersion {
    return version === '2.0' ? '2.0' : '1.0';
  }

  private getThemeColor(tokenName: string, fallback: string): string {
    if (this.designSystemsVersion !== '2.0') {
      return fallback;
    }

    return `var(${tokenName}, ${fallback})`;
  }

  private lockBodyScroll() {
    if (this.previousBodyOverflow === undefined) {
      this.previousBodyOverflow = document.body.style.overflow;
    }
    document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll() {
    if (this.previousBodyOverflow !== undefined) {
      document.body.style.overflow = this.previousBodyOverflow;
      this.previousBodyOverflow = undefined;
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
    this.lockBodyScroll();
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
      this.unlockBodyScroll();
    }
  };

  private closeFeedbackForm() {
    this.reset();
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'true');
    this.feedbackFormRef?.value?.setAttribute('data-show', 'false');
    this.startRef?.value?.setAttribute('data-show', 'false');
    this.onDimChange(false);
    this.unlockBodyScroll();
  }
  private closeErrorForm() {
    this.closeFeedbackForm();
    this.feedbackFormRef?.value?.setAttribute('data-error', 'false');
    this.reset();
    this.unlockBodyScroll();
  }
  private closeAllFeedback() {
    this.closeFeedbackForm();
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'false');
    this.reset();
    this.unlockBodyScroll();
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
      <div class="adsp-fb-rating-item">
        <img
          src="${rating.svgDefault}"
          @mouseover="${() => this.updateHover(index, true)}"
          @mouseout="${() => this.updateHover(index, false)}"
          @click="${() => this.selectRating(index)}"
          @keydown=${(event: KeyboardEvent) => this.handleKeyHowEasy(event, index)}
          class="adsp-fb-rating-icon"
          alt="${rating.label}"
          tabindex="0"
          aria-label="${rating.label}"
        />

        <p
          class="adsp-fb-rating-text"
          @mouseover="${() => this.updateHover(index, true)}"
          @mouseout="${() => this.updateHover(index, false)}"
          @click="${() => this.selectRating(index)}"
        >
          ${rating.label}
        </p>
        <span class="adsp-fb-tooltip-text">${rating.label}</span>
      </div>
    `;
  };
  private updateHover = (index: number, isHovering: boolean) => {
    const isSmallScreen = window.matchMedia('(max-width: 640px)').matches;
    const rating = this.ratings[index];
    const images = this.getWidgetElements<HTMLImageElement>('.adsp-fb-rating-icon');
    const image = images[index] as HTMLImageElement;
    image.src =
      isHovering && this.selectedRating !== index
        ? rating.svgHover
        : this.selectedRating === index
          ? rating.svgClick
          : rating.svgDefault;

    const texts = this.getWidgetElements<HTMLElement>('.adsp-fb-rating-text');
    const text = texts[index] as HTMLImageElement;
    text.style.color = isHovering
      ? this.getThemeColor('--adsp-fb-color-primary-hover', '#004F84')
      : this.selectedRating === index
        ? this.getThemeColor('--adsp-fb-color-primary-selected', '#0081A2')
        : this.getThemeColor('--adsp-fb-color-text', '#333333');
    if (!isSmallScreen) {
      const tooltips = this.getWidgetElements<HTMLElement>('.adsp-fb-tooltip-text');
      const tooltip = tooltips[index] as HTMLImageElement;
      tooltip.style.visibility = isHovering ? 'visible' : 'hidden';
      tooltip.style.opacity = isHovering ? '1' : '0';
      if (index === 0) {
        tooltip.style.marginLeft = '35px';
        tooltip.classList.add('adsp-fb-tooltip-modified');
      }
    }
  };

  private defaultRating = () => {
    for (let i = 0; i < this.ratings.length; i++) {
      const rating = this.ratings[i];
      const images = this.getWidgetElements<HTMLImageElement>('.adsp-fb-rating-icon');
      const image = images[i] as HTMLImageElement;

      image.src = rating.svgDefault;
    }
  };
  private errorsOnRating = (isError: boolean) => {
    for (let i = 0; i < this.ratings.length; i++) {
      const rating = this.ratings[i];
      const images = this.getWidgetElements<HTMLImageElement>('.adsp-fb-rating-icon');
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

  private handleTextInput = (
    inputRef: Ref<HTMLTextAreaElement>,
    countRef: Ref<HTMLSpanElement>,
    warningRef: Ref<HTMLSpanElement>,
  ) => {
    const el = inputRef.value;
    if (!el) return;

    const len = el.value.length;
    if (len > this.MAX_CHAR_LIMIT) {
      el.value = el.value.substring(0, this.MAX_CHAR_LIMIT);
      warningRef.value!.textContent = this.CHAR_LIMIT_WARNING;
      warningRef.value!.classList.add('visible');
    } else {
      warningRef.value!.classList.remove('visible');
    }

    countRef.value!.textContent = `${len} / ${this.MAX_CHAR_LIMIT}`;
  };

  private handleCommentInput = () =>
    this.handleTextInput(this.commentRef, this.commentCharCountRef, this.commentWarningRef);

  private handleTechnicalCommentInput = () =>
    this.handleTextInput(this.technicalCommentRef, this.techCharCountRef, this.techWarningRef);

  private selectRating = (index: number) => {
    this.errorsOnRating(false);
    if (this.ratingErrorText.value) {
      this.ratingErrorText.value.classList.remove('visible');
    }

    this.updateHover(index, false);
    const images = this.getWidgetElements<HTMLImageElement>('.adsp-fb-rating-icon');
    const ratingNew = this.ratings[index];
    const imageNew = images[index] as HTMLImageElement;
    imageNew.src = ratingNew.svgClick;
    if (this.selectedRating !== -1) {
      const rating = this.ratings[this.selectedRating];
      const image = images[this.selectedRating] as HTMLImageElement;
      image.src = rating.svgDefault;
      const texts = this.getWidgetElements<HTMLElement>('.adsp-fb-rating-text');
      const text = texts[this.selectedRating] as HTMLImageElement;
      text.style.color = this.getThemeColor('--adsp-fb-color-text', '#333333');
    }
    this.selectedRating = index;
    this.lastFocusableElement = this.sendButtonRef;
    const texts = this.getWidgetElements<HTMLElement>('.adsp-fb-rating-text');
    const text = texts[index] as HTMLImageElement;
    text.style.color = this.getThemeColor('--adsp-fb-color-primary-selected', '#0081A2');
  };

  public openFeedbackForm() {
    this.openStartForm();
  }

  public initialize({ apiUrl, tenant, designSystemsVersion, getAccessToken, getContext }: FeedbackOptions) {
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

    this.designSystemsVersion = this.normalizeDesignSystemsVersion(designSystemsVersion);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const head = document.querySelector('head');
    if (head && !document.getElementById('adsp-feedback-widget-styles')) {
      const style = document.createElement('style');
      style.id = 'adsp-feedback-widget-styles';
      style.textContent = feedbackStyles;
      head.append(style);
    }

    const body = document.querySelector('body');
    if (body) {
      render(
        html`
          <div ${ref(this.rootRef)} class="adsp-fb-root" data-design-system="${this.designSystemsVersion}">
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
            <div ${ref(this.dimRef)} class="adsp-fb-overlay">
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
                    <h3 class="h3-sub-title"><b>Tell us what you think</b></h3>
                    <br />
                    <p class="p-content">
                      Please help us improve our service by sharing feedback about your experience. This will only take
                      a minute.
                    </p>
                    <p>All responses are anonymous.</p>
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
                          @input=${this.handleCommentInput}
                          placeholder=""
                          aria-label="Comments textarea"
                        ></textarea>

                        <span ${ref(this.commentCharCountRef)} class="char-count"></span>
                        <span ${ref(this.commentWarningRef)} class="char-warning"></span>
                        <span class="help-text"
                          >Do not include personal information like SIN, password, addresses, etc.</span
                        >
                      </div>
                      <hr class="hr-width" />
                      <br />
                      <div class="adsp-fb-radio-container">
                        <label><b>Did you experience any technical issues?</b></label>
                        <div class="adsp-fb-radios" @change=${this.onIssueChange}>
                          <div id="technicalIssueYes" class="adsp-fb-radio-span">
                            <input
                              tabindex="0"
                              name="YesOrNo"
                              type="radio"
                              id="yes"
                              value="Yes"
                              class="adsp-fb-radio"
                              ${ref(this.ratingSelector)}
                              aria-label="Yes"
                              @keydown=${(e: KeyboardEvent) => {
                                this.handleRadioKeyDown(e);
                              }}
                            />
                            <label for="yes" class="adsp-fb-radio-label"> Yes </label>
                          </div>
                          <div class="adsp-fb-radio-span">
                            <input
                              tabindex="0"
                              name="YesOrNo"
                              type="radio"
                              id="no"
                              value="No"
                              class="adsp-fb-radio"
                              ${ref(this.commentSelector)}
                              aria-label="No"
                              @keydown=${(e: KeyboardEvent) => {
                                this.handleRadioKeyDown(e);
                              }}
                            />

                            <label for="no" class="adsp-fb-radio-label"> No </label>
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
                            @input=${this.handleTechnicalCommentInput}
                            aria-label="Technical comments textarea"
                          ></textarea>

                          <span ${ref(this.techCharCountRef)} class="char-count"></span>
                          <span ${ref(this.techWarningRef)} class="char-warning"></span>
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
                          <h3 class="h3-error">We are experiencing a problem</h3>
                          <p class="p-error">
                            we are experiencing an issue trying to load this page. Please try again in a few minutes. We
                            apologize for the inconvenience.
                          </p>
                          <div class="errorButton">
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
        { host: this },
      );
    }
  }
}

const adspFeedback = new AdspFeedback();

// This is to support the development scaffold.
// Consuming apps should include non-module script element which will import and set global variable.
window.adspFeedback = adspFeedback;

export default adspFeedback;
