import { html, render } from 'lit-html';
import { ref, createRef, Ref } from 'lit-html/directives/ref.js';
import { AdspFeedback as AdspFeedbackApi, FeedbackContext, FeedbackOptions } from './types';

class AdspFeedback implements AdspFeedbackApi {
  private tenant?: string;
  private apiUrl?: URL;
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
    }
  }

  private closeFeedbackForm() {
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
        this.feedbackFormRef.value.style.height = '820px';
      } else {
        this.technicalCommentDivRef?.value?.setAttribute('style', 'display:none');
        this.feedbackFormRef.value.style.height = '600px';
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
      svgDefault: 'assets/feedback/Likert_Default_Very-Difficult.svg',
      svgActive: 'assets/feedback/Likert_Active_Very-Difficult.svg',
      svgHover: 'assets/feedback/Likert_Hover_Very-Difficult.svg',
    },
    {
      label: 'Difficult',
      rate: 'bad',
      value: 1,
      svgDefault: 'assets/feedback/Likert_Default_Difficult.svg',
      svgActive: 'assets/feedback/Likert_Active_Difficult.svg',
      svgHover: 'assets/feedback/Likert_Hover_Difficult.svg',
    },
    {
      label: 'Neutral',
      rate: 'neutral',
      value: 2,
      svgDefault: 'assets/feedback/Likert_Default_Neutral.svg',
      svgActive: 'assets/feedback/Likert_Active_Neutral.svg',
      svgHover: 'assets/feedback/Likert_Active_Neutral.svg',
    },
    {
      label: 'Easy',
      rate: 'good',
      value: 3,
      svgDefault: 'assets/feedback/Likert_Default_Easy.svg',
      svgActive: 'assets/feedback/Likert_Active_Easy.svg',
      svgHover: 'assets/feedback/Likert_Hover_Easy.svg',
    },
    {
      label: 'Very Easy',
      rate: 'delightful',
      value: 4,
      svgDefault: 'assets/feedback/Likert_Default_Very-Easy.svg',
      svgActive: 'assets/feedback/Likert_Active_Very-Easy.svg',
      svgHover: 'assets/feedback/Likert_Hover_Very-Easy.svg',
    },
  ];

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
    }
  }

  public initialize({ apiUrl, tenant, getAccessToken, getContext }: FeedbackOptions) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderRating = (rating: any, index: number) => {
      return html`
        <img
          src="${this.selectedRating >= index ? rating.svgActive : rating.svgDefault}"
          @mouseover="${() => updateHover(index, true)}"
          @mouseout="${() => updateHover(index, false)}"
          @click="${() => selectRating(index)}"
          class="rating"
          alt="${rating.label}"
        />
      `;
    };
    const updateHover = (index: number, isHovering: boolean) => {
      const rating = this.ratings[index];
      const images = document.querySelectorAll('.rating');
      const image = images[index] as HTMLImageElement;
      image.src = isHovering ? rating.svgHover : this.selectedRating === index ? rating.svgActive : rating.svgDefault;
    };

    const selectRating = (index: number) => {
      if (this.selectedRating !== -1) {
        const rating = this.ratings[this.selectedRating];
        const images = document.querySelectorAll('.rating');
        const image = images[this.selectedRating] as HTMLImageElement;
        image.src = rating.svgDefault;
      }
      this.selectedRating = index;
      if (this.selectedRating !== -1) {
        this.sendButtonRef.value?.removeAttribute('disabled');
      }
    };

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
            width: 644px;
            height: 600px;
            left: 50%;
            top: 10vh;
            position: absolute
            bottom: 16px;
            border: 1px solid;
            overflow: hidden;
            border-radius: 3px;
            transform: translateX(-50%)
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
          }
          .adsp-fb .adsp-fb-form {
            display: flex;
            box-sizing: border-box;
            flex-direction: column;
            height: 100%;
            padding: 24px 24px;
            transition: transform 100ms;
          }
          .adsp-fb .adsp-fb-form-rating {
            display: flex;
            flex-direction: row;
            border: 0;
            padding: 0 48px 0 12px;
            justify-content: space-between;
          }
          .adsp-fb .adsp-fb-form-rating legend {
            margin-bottom: 12px;
          }
          .adsp-fb .adsp-fb-form-comment {
            display: flex;
            flex-direction: column;
            margin-top: 24px;
          }
          .adsp-fb .adsp-fb-form-comment textarea {
            margin-top: 12px;
            margin-bottom: 12px;
            resize: none;
            min-height: 100px;
            width: 100%;
          }
          .adsp-fb .adsp-fb-actions {
            display: flex;
            margin-top: 24px;
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
          }
          .adsp-fb .adsp-fb-form-container[data-error='true'] .adsp-fb-form {
            transform: translateX(-100%);
          }
          .adsp-fb .adsp-fb-form-container[data-completed='true'] .adsp-fb-sent {
            visibility: visible;
          }

          .adsp-fb .adsp-fb-form-container[data-error='true'] .adsp-fb-error {
            visibility: visible;
          }
          .rating {
            cursor: pointer;
            transition: transform 0.3s ease-in-out;
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
          @media screen and (max-width: 922px) {
            .adsp-fb div.adsp-fb-form-container {
              left: 5vh;
            }
          }
          @media screen and (max-width: 623px) {
            .adsp-fb div.adsp-fb-form-container {
              right: 0;
              top: 0;
              bottom: 0;
              left: 0;
              border: 0;
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
            <div  ${ref(this.dimRef)} class="overlay">
              <div class="adsp-fb">
                <div ${ref(this.startRef)} class="adsp-fb-form-container adsp-fb-start" data-show="false">
                  <div class="adsp-fb-container-heading">
                    <h2>Give feedback</h2>
                    <img
                      src="assets/icons/close-outline.svg"
                      width="30px"
                      height="30px"
                      @click="${this.closeFeedbackForm}"
                      alt="close feedback"
                    />
                  </div>
                  <hr />
                  <form class="adsp-fb-form">
                    <h3>Tell us what your think</h3>
                    <p>
                      Please help us improve our service by sharing feedback about your experience. This will only take a
                      minute.
                    </p>
                    <div class="adsp-fb-actions">
                      <button class="adsp-fb-form-primary" @click=${this.closeStartForm} type="button">Start</button>
                    </div>
                  </form>
                </div>

                <div ${ref(this.feedbackFormRef)} class="adsp-fb-form-container" data-show="false">
                  <div class="adsp-fb-container-heading">
                    <h2>Give feedback</h2>
                    <img
                      src="assets/icons/close-outline.svg"
                      width="30px"
                      height="30px"
                      @click="${this.closeFeedbackForm}"
                      alt="close feedback"
                    />
                  </div>
                  <hr />
                  <form class="adsp-fb-form" >
                    <div class="adsp-fb-form-rating" ${ref(this.ratingRef)}>
                      ${this.ratings.map((rating, index) => renderRating(rating, index))}
                    </div>
                    <div class="adsp-fb-form-comment">
                      <label for="comment"><b>Do you have any additional comments?</b> <span>(optional)</span></label>
                      <textarea
                        id="comment"
                        ${ref(this.commentRef)}
                        placeholder="Remember not to include personal information like SIN, password, addresses, etc.  "
                      ></textarea>
                    </div>
                    <hr />
                    <br />
                    <div>
                      <label for="technicalComment"><b>Did you experience any technical issues?</b></label>

                      <div ${ref(this.isTechnicalIssueRef)} @change=${this.onIssueChange}>
                        <label for="YesOrNo" class="radioButton">
                          <input name="YesOrNo" type="radio" id="yes" value="Yes" />
                          Yes
                        </label>
                        <label for="YesOrNo">
                          <input name="YesOrNo" type="radio" id="no" value="No" />
                          No
                        </label>
                      </div>
                      <div ${ref(this.technicalCommentDivRef)} >
                      <div class="adsp-fb-form-comment" >
                        <label for="comment"
                          ><b
                            >Please describe the issue in detail. Mention the page or step where you experienced the issue,
                            if applicable.</b
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
                    <div>
                    <p>
                      The personal information collected is pursuant to section 33(c) of the Freedom of information and
                      Protection of Privacy Act (RSA 2000, C.F-25).
                    </p>
                    <p>
                      Questions regarding the collection, use and disclosure may be directed to [program area contact info
                      here].
                    </p>
                    <div class="adsp-fb-actions">
                      <button @click=${this.closeFeedbackForm} type="button">Cancel</button>
                      <button
                        ${ref(this.sendButtonRef)}
                        class="adsp-fb-form-primary"
                        @click=${this.sendFeedback}
                        type="button"
                        disabled
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                <div class="adsp-fb-sent adsp-fb-message">
                    <p>Success! <img
                    src="assets/icons/green-circle-checkmark.svg"
                    width="18px"
                    height="18px"
                    alt="Success"
                    /></p>
                    <p>
                      Thank you for providing your feedback. We will use your input to improve the service. You will not
                      receive a response from this submission. If you do require a response, you can contact government
                      through <a href="https://www.alberta.ca/contact-government">Alberta Connects</a>.
                    </p>
                    <div class="adsp-fb-actions">
                      <button @click=${this.closeAllFeedback} class="adsp-fb-form-primary" type="button">Close</button>
                    </div>
                </div>
                <div class="adsp-fb-error adsp-fb-message">
                  <div>
                    <img src="assets/feedback/Error_Icon.svg" width="50px" height="50px"alt="Error"/>
                    </div>
                    <div class="errorText">Error 500</div>
                    <div>
                    <img src="assets/feedback/Blue-Underline.svg" width="50px" />
                    <div>
                    <h3>We are experiencing a problem</h3>
                  <p>
                    we are experiencing an issue trying to load this page. Please try again in a few minutes. We apologize for the inconvenience.
                  </p>
                    <div>
                      <button @click=${this.closeErrorForm} class="adsp-fb-form-primary" type="button">Close</button>
                    </div>
                  </div>
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
