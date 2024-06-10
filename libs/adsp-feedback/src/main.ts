import { html, render } from 'lit-html';
import { ref, createRef, Ref } from 'lit-html/directives/ref.js';
import { AdspFeedback as AdspFeedbackApi, FeedbackContext, FeedbackOptions } from './types';

import blueUnderLineSvg from './assets/Blue-Underline.svg';
import closeOutlineSvg from './assets/close-outline.svg';
import errorIconSvg from './assets/Error_Icon.svg';
import greenCircleCheckmarkSvg from './assets/green-circle-checkmark.svg';

import veryDifficultSvgDefault from './assets/Very_Difficult-Default.svg';
import veryDifficultSvgError from './assets/Very_Difficult-Error.svg';
import veryDifficultSvgHover from './assets/Very_Difficult-Hover.svg';
import veryDifficultSvgClick from './assets/Very_Difficult-Click.svg';

import difficultSvgDefault from './assets/Difficult-Default.svg';
import difficultSvgError from './assets/Difficult-Error.svg';
import difficultSvgHover from './assets/Difficult-Hover.svg';
import difficultSvgClick from './assets/Difficult-Click.svg';

import neutralSvgDefault from './assets/Neutral-Default.svg';
import neutralSvgError from './assets/Neutral-Error.svg';
import neutralSvgHover from './assets/Neutral-Hover.svg';
import neutralSvgClick from './assets/Neutral-Click.svg';

import easySvgDefault from './assets/Easy-Default.svg';
import easySvgError from './assets/Easy-Error.svg';
import easySvgHover from './assets/Easy-Hover.svg';
import easySvgClick from './assets/Easy-Click.svg';

import veryEasySvgDefault from './assets/Very_Easy-Default.svg';
import veryEasySvgError from './assets/Very_Easy-Error.svg';
import veryEasySvgHover from './assets/Very_Easy-Hover.svg';
import veryEasySvgClick from './assets/Very_Easy-Click.svg';

class AdspFeedback implements AdspFeedbackApi {
  private tenant?: string;
  private apiUrl?: URL;
  private name?: string;
  private email?: string;
  private getAccessToken?: () => Promise<string>;
  private getContext: () => Promise<FeedbackContext>;

  private feedbackBadgeRef: Ref<HTMLDivElement> = createRef();
  private feedbackFormRef: Ref<HTMLDivElement> = createRef();
  private ratingRef: Ref<HTMLFieldSetElement> = createRef();
  private commentRef: Ref<HTMLTextAreaElement> = createRef();
  private sendButtonRef: Ref<HTMLButtonElement> = createRef();
  private startRef: Ref<HTMLFieldSetElement> = createRef();
  private isTechnicalIssueRef: Ref<HTMLFieldSetElement> = createRef();
  private technicalCommentDivRef: Ref<HTMLFieldSetElement> = createRef();
  private technicalCommentRef: Ref<HTMLTextAreaElement> = createRef();
  private dimRef: Ref<HTMLTextAreaElement> = createRef();
  private radio1Ref: Ref<HTMLInputElement> = createRef();
  private radio2Ref: Ref<HTMLInputElement> = createRef();

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
    this.onDimChange(true);
  }

  private closeStartForm() {
    this.startRef?.value?.setAttribute('data-show', 'false');
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'false');
    this.feedbackFormRef?.value?.setAttribute('data-show', 'true');
    this.technicalCommentDivRef?.value?.setAttribute('style', 'display:none');
    if (this.feedbackFormRef.value) {
      this.feedbackFormRef.value.style.height = '600px';
      this.feedbackFormRef.value?.scrollTo(0, 0);
    }
  }

  private closeFeedbackForm() {
    this.reset();
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'true');
    this.feedbackFormRef?.value?.setAttribute('data-show', 'false');
    this.startRef?.value?.setAttribute('data-show', 'false');
    this.onDimChange(false);
  }
  private closeErrorForm() {
    this.closeFeedbackForm();
    this.feedbackFormRef?.value?.setAttribute('data-error', 'false');
  }
  private closeAllFeedback() {
    this.closeFeedbackForm();
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'false');
  }

  private onIssueChange(event: Event) {
    if (event.target instanceof HTMLInputElement && this.feedbackFormRef.value) {
      if (event.target.value.toLowerCase() === 'yes') {
        this.technicalCommentDivRef?.value?.setAttribute('style', 'display:block');
        this.feedbackFormRef.value?.scrollTo({
          top: 640,
          behavior: 'smooth',
        });
      } else {
        this.technicalCommentDivRef?.value?.setAttribute('style', 'display:none');
        this.feedbackFormRef.value?.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }
  }
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
  private ratings = [
    {
      label: 'Very Difficult',
      rate: 'terrible',
      value: 0,
      svgDefault: veryDifficultSvgDefault,
      svgError: veryDifficultSvgError,
      svgHover: veryDifficultSvgHover,
      svgClick: veryDifficultSvgClick,
    },
    {
      label: 'Difficult',
      rate: 'bad',
      value: 1,
      svgDefault: difficultSvgDefault,
      svgError: difficultSvgError,
      svgHover: difficultSvgHover,
      svgClick: difficultSvgClick,
    },
    {
      label: 'Neutral',
      rate: 'neutral',
      value: 2,
      svgDefault: neutralSvgDefault,
      svgError: neutralSvgError,
      svgHover: neutralSvgHover,
      svgClick: neutralSvgClick,
    },
    {
      label: 'Easy',
      rate: 'good',
      value: 3,
      svgDefault: easySvgDefault,
      svgError: easySvgError,
      svgHover: easySvgHover,
      svgClick: easySvgClick,
    },
    {
      label: 'Very Easy',
      rate: 'delightful',
      value: 4,
      svgDefault: veryEasySvgDefault,
      svgError: veryEasySvgError,
      svgHover: veryEasySvgHover,
      svgClick: veryEasySvgClick,
    },
  ];

  private reset() {
    this.clearRating(this.selectedRating);
    this.selectedRating = -1;
    if (this.commentRef.value) {
      this.commentRef.value.value = '';
    }
    if (this.technicalCommentRef?.value) {
      this.technicalCommentRef.value.value = '';
    }
    if (this.radio1Ref.value) {
      this.radio1Ref.value.checked = false;
    }
    if (this.radio2Ref.value) {
      this.radio2Ref.value.checked = false;
    }
  }

  private async sendFeedback() {
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
    this.sendButtonRef.value?.setAttribute('disabled', 'disabled');
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

        if (!response.ok) {
          console.log(`Response received for sending feedback to API not 200: ${response.status}`);
          this.feedbackFormRef?.value?.setAttribute('data-error', 'true');
        } else {
          this.feedbackFormRef.value?.setAttribute('data-completed', 'true');
        }
      } catch (err) {
        console.log(`Error encountered sending feedback to API: ${err}`);

        this.feedbackFormRef?.value?.setAttribute('data-error', 'true');
      }
      if (this.feedbackFormRef.value) {
        this.feedbackFormRef.value.style.height = '420px';
      }
      this.feedbackFormRef.value?.scrollTo(0, 0);
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
          class="rating"
          alt="${rating.label}"
          tabindex="0"
        />
        <span class="tooltip-text">${rating.label}</span>
        <p
          class="ratingText"
          @mouseover="${() => this.updateHover(index, true)}"
          @mouseout="${() => this.updateHover(index, false)}"
          @click="${() => this.selectRating(index)}"
        >
          ${rating.label}
        </p>
      </div>
    `;
  };
  private updateHover = (index: number, isHovering: boolean) => {
    const rating = this.ratings[index];
    const images = document.querySelectorAll('.rating');
    const image = images[index] as HTMLImageElement;
    image.src = isHovering ? rating.svgHover : this.selectedRating === index ? rating.svgClick : rating.svgDefault;

    const texts = document.querySelectorAll('.ratingText');
    const text = texts[index] as HTMLImageElement;
    text.style.color = isHovering ? '#004F84' : this.selectedRating === index ? '#0081A2' : '#333333';

    const tooltips = document.querySelectorAll('.tooltip-text');
    const tooltip = tooltips[index] as HTMLImageElement;
    tooltip.style.visibility = isHovering ? 'visible' : 'hidden';
    tooltip.style.opacity = isHovering ? '1' : '0';
  };

  private clearRating = (index: number) => {
    if (index > 0) {
      const rating = this.ratings[index];
      const images = document.querySelectorAll('.rating');
      const image = images[index] as HTMLImageElement;
      image.src = rating.svgDefault;

      const texts = document.querySelectorAll('.ratingText');
      const text = texts[index] as HTMLImageElement;
      text.style.color = '#333333';
    }
  };

  private selectRating = (index: number) => {
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
    this.sendButtonRef.value?.removeAttribute('disabled');

    const texts = document.querySelectorAll('.ratingText');
    const text = texts[index] as HTMLImageElement;
    text.style.color = '#0081A2';
  };

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

          .adsp-fb {
            z-index: 100;
            font-family: acumin-pro-semi-condensed, helvetica-neue, arial, sans-serif;
          }
          .adsp-fb > *[data-show]:not([data-show='true']) {
            display: none;
          }
          .adsp-fb .adsp-fb-badge {
            z-index: 1;
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
          }

          .adsp-fb .adsp-fb-form-container {
            z-index: 2;
            background: #ffffff;
            position: fixed;
            width: 640px;
            max-height: 680px;
            left: 50%;
            top: 10vh;
            border: 1px solid;
            border-radius: 3px;
            transform: translateX(-50%);
          }
          .adsp-fb .adsp-fb-start {
            height: 380px;
          }
          .adsp-fb .adsp-fb-container-heading {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding-right: 20px;
            padding-top: 1rem;

            > img {
              cursor: pointer;
            }
          }
          .adsp-fb .adsp-fb-form {
            display: flex;
            box-sizing: border-box;
            flex-direction: column;
            padding: 24px 24px;
            transition: transform 100ms;
            height: 100%;
            justify-content: space-between;
          }
          .adsp-fb .adsp-fb-content {
            max-height: 375px;
            overflow-y: scroll;
            overflow-x: hidden;
            flex: 1;
            padding-right: 16px;
          }
          .adsp-fb .adsp-fb-form-rating {
            display: flex;
            flex-direction: row;
            border: 0;
            padding: 0 48px 0 12px;
            margin-top: 12px;
            justify-content: space-between;

            > div > img {
              width: 80px;
            }
            > div > p {
              visibility: hidden;
            }
          }

          .adsp-fb .adsp-fb-form-comment {
            display: flex;
            flex-direction: column;
            margin-bottom: 12px;
          }
          .adsp-fb .adsp-fb-form-comment span {
            color: var(--color-gray-600);
          }

          .adsp-fb .adsp-fb-form-comment textarea {
            margin-top: 12px;
            resize: none;
            min-height: 100px;
            width: 100%;
          }
          .adsp-fb .adsp-fb-actions {
            display: flex;
            bottom: 0;
            padding-bottom: 48px;
            padding-right: 24px;
            margin-top: 24px;
            margin-bottom: 48px;
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
          .adsp-fb button:first-child {
            margin-left: auto !important;
          }
          .adsp-fb button.adsp-fb-form-primary {
            margin-left: 24px;
            background: #0070c4;
            color: #ffffff;
          }
          .adsp-fb button[disabled] {
            pointer-events: none;
            opacity: 0.5;
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
          .adsp-fb .tooltip-text {
            visibility: hidden;

            margin-left: 40px;
            background-color: #666666;
            color: #fff;
            text-align: center;
            border-radius: 5px;
            padding: 5px;
            margin-top: 60px;
            position: absolute;
            z-index: 1;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s;
          }
          .adsp-fb .tooltip-text::before {
            content: '';
            position: absolute;
            top: -9px;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: transparent transparent #333 transparent;
          }
          .adsp-fb .rating-div {
            display: flex;
            flex-direction: column;
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
          }
          .adsp-fb .adsp-fb-form-container[data-error='true'] .adsp-fb-form {
            transform: translateX(-100%);
            visibility: hidden;
          }
          .adsp-fb .adsp-fb-form-container[data-completed='true'] .adsp-fb-sent {
            visibility: visible;
          }

          .adsp-fb .adsp-fb-form-container[data-error='true'] .adsp-fb-error {
            visibility: visible;
          }
          .radios {
            margin-top: 12px;
            margin-bottom: 12px;
          }
          .rating {
            cursor: pointer;
            transition: transform 0.3s ease-in-out color 0.3s ease;
          }
          .rating:hover {
            transform: scale(1.2);
          }
          hr {
            margin-top: 0.25rem;
          }
          h2 {
            padding-left: 24px;
          }
          .radioButton {
            padding-right: 24px;
          }
          .errorText {
            color: #dcdcdc;
            font-size: 18px;
          }
          .successButton {
            margin-top: 24px;
          }
          @media screen and (max-width: 768px) {
            .adsp-fb div.adsp-fb-form-container {
            }
          }
          @media screen and (max-width: 640px) {
            .adsp-fb div.adsp-fb-form-container {
              right: 0;
              top: 0;
              bottom: 0;
              border: 0;
              width: 100%;
            }
            .adsp-fb .adsp-fb-actions {
              position: -webkit-sticky;
              position: sticky;
              bottom: 0;
              flex-direction: column;
              > button {
                width: 100%;
                margin-top: 12px;
              }
            }
            .adsp-fb button.adsp-fb-form-primary {
              margin-left: 0;
            }
            .adsp-fb .adsp-fb-form-rating {
              flex-direction: column;
              align-items: left;

              > div {
                display: flex;
                flex-direction: row;
              }
              > div > img {
                width: 32px;
              }
              > div > p {
                visibility: visible;
              }
              > div > p :hover {
                color: #004f84;
              }
              > div > span {
                display: none;
              }
            }
            .ratingText {
              padding-top: 12px;
              cursor: pointer;
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
              <div ${ref(this.feedbackBadgeRef)} class="adsp-fb-badge" data-show="true" @click=${this.openStartForm}>
                <span>Feedback</span>
              </div>
            </div>
            <div ${ref(this.dimRef)} class="overlay">
              <div class="adsp-fb">
                <div ${ref(this.startRef)} class="adsp-fb-form-container adsp-fb-start" data-show="false">
                  <div class="adsp-fb-container-heading">
                    <h2>Give feedback</h2>
                    <img
                      src=${closeOutlineSvg}
                      width="30px"
                      height="30px"
                      @click="${this.closeFeedbackForm}"
                      alt="close feedback"
                    />
                  </div>
                  <hr />
                  <form class="adsp-fb-form">
                    <h3>Tell us what you think</h3>
                    <p>
                      Please help us improve our service by sharing feedback about your experience. This will only take
                      a minute.
                    </p>
                    <div class="adsp-fb-actions">
                      <button class="adsp-fb-form-primary" @click=${this.closeStartForm} type="button" tabindex="0">
                        Start
                      </button>
                    </div>
                  </form>
                </div>

                <div ${ref(this.feedbackFormRef)} class="adsp-fb-form-container" data-show="false">
                  <div class="adsp-fb-container-heading">
                    <h2>Give feedback</h2>
                    <img
                      src=${closeOutlineSvg}
                      width="30px"
                      height="30px"
                      @click="${this.closeFeedbackForm}"
                      alt="close feedback"
                    />
                  </div>
                  <hr />
                  <form class="adsp-fb-form">
                    <div class="adsp-fb-content">
                      <label for="comment"
                        ><b>How easy was it for you to use this service? <br /></b>
                      </label>
                      <div class="adsp-fb-form-rating" ${ref(this.ratingRef)}>
                        ${this.ratings.map((rating, index) => this.renderRating(rating, index))}
                      </div>
                      <div class="adsp-fb-form-comment">
                        <label for="comment"><b>Do you have any additional comments?</b> <span>(optional)</span></label>
                        <textarea id="comment" ${ref(this.commentRef)} placeholder=""></textarea>
                        <span>Do not include personal information like SIN, password, addresses, etc.</span>
                      </div>
                      <hr />
                      <br />
                      <div>
                        <label for="technicalComment"><b>Did you experience any technical issues?</b></label>
                        <div class="radios" ${ref(this.isTechnicalIssueRef)} @change=${this.onIssueChange}>
                          <label for="YesOrNo" class="radioButton">
                            <input name="YesOrNo" type="radio" id="yes" value="Yes" ${ref(this.radio1Ref)} />
                            Yes
                          </label>
                          <label for="YesOrNo">
                            <input name="YesOrNo" type="radio" id="no" value="No" ${ref(this.radio2Ref)} />
                            No
                          </label>
                        </div>
                        <div ${ref(this.technicalCommentDivRef)}>
                          <div class="adsp-fb-form-comment">
                            <label for="comment"
                              ><b
                                >Please describe the issue in detail. Mention the page or step where you experienced the
                                issue, if applicable.</b
                              >
                            </label>
                            <textarea
                              ${ref(this.technicalCommentRef)}
                              id="technicalComment"
                              placeholder="Remember not to include personal information like SIN, password, addresses, etc.  "
                            ></textarea>
                          </div>
                          <br />
                        </div>
                      </div>
                    </div>
                    <div class=" adsp-fb-actions">
                      <button @click=${this.closeFeedbackForm} type="button" tabindex="0">Cancel</button>
                      <button
                        ${ref(this.sendButtonRef)}
                        class="adsp-fb-form-primary"
                        @click=${this.sendFeedback}
                        type="button"
                        disabled
                        tabindex="0"
                      >
                        Submit
                      </button>
                    </div>

                    <div class="adsp-fb-sent adsp-fb-message">
                      <p>
                        Success!
                        <img src=${greenCircleCheckmarkSvg} width="18px" height="18px" alt="Success" />
                      </p>
                      <p>
                        Thank you for providing your feedback. We will use your input to improve the service. You will
                        not receive a response from this submission. If you do require a response, you can contact
                        government through <a href="https://www.alberta.ca/contact-government">Alberta Connects</a>.
                      </p>
                      <div class="adsp-fb-actions">
                        <button @click=${this.closeAllFeedback} class="adsp-fb-form-primary" type="button" tabindex="0">
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
                        <img src=${blueUnderLineSvg} width="50px" />
                        <div>
                          <h3>We are experiencing a problem</h3>
                          <p>
                            we are experiencing an issue trying to load this page. Please try again in a few minutes. We
                            apologize for the inconvenience.
                          </p>
                          <div>
                            <button
                              @click=${this.closeErrorForm}
                              class="adsp-fb-form-primary"
                              type="button"
                              tabindex="0"
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
