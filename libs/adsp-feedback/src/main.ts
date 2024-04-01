import { html, render } from 'lit-html';
import { ref, createRef, Ref } from 'lit-html/directives/ref.js';

export interface FeedbackContext {
  tenant?: string;
  site: string;
  view: string;
  interaction?: string;
}

export interface FeedbackOptions {
  tenant?: string;
  site?: string;
  apiUrl?: string;
  getAccessToken?: () => Promise<string>;
  getContext?: () => Promise<FeedbackContext>;
}

class AdspFeedback {
  private tenant: string = '';
  private apiUrl: URL | null = null;
  private getAccessToken = function () {
    return Promise.resolve('');
  };
  private getContext: () => Promise<FeedbackContext>;

  private feedbackBadgeRef: Ref<HTMLDivElement> = createRef();
  private feedbackFormRef: Ref<HTMLDivElement> = createRef();
  private ratingRef: Ref<HTMLFieldSetElement> = createRef();
  private commentRef: Ref<HTMLTextAreaElement> = createRef();
  private sendButtonRef: Ref<HTMLButtonElement> = createRef();

  constructor() {
    const scriptElement = document.currentScript as HTMLScriptElement;
    if (scriptElement) {
      this.apiUrl = new URL('/feedback/v1/feedback', scriptElement.src);
    }

    const site = `${document.location.protocol}//${document.location.host}`;
    this.getContext = function () {
      return Promise.resolve({ site, view: document.location.pathname });
    };
  }

  public openFeedbackForm() {
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'false');
    this.feedbackFormRef?.value?.setAttribute('data-show', 'true');
  }

  public closeFeedbackForm() {
    this.feedbackBadgeRef?.value?.setAttribute('data-show', 'true');
    this.feedbackFormRef?.value?.setAttribute('data-show', 'false');
  }

  private onRatingChange(event: Event) {
    // Radio group cannot be unset, so after it's set once we can enable the submit.
    // This state will only reset if the page is reloaded and the element is re-added to DOM.
    if (event.target instanceof HTMLInputElement) {
      this.sendButtonRef.value?.removeAttribute('disabled');
    }
  }

  private async sendFeedback() {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const context = await this.getContext();
    const comment = this.commentRef.value?.value;
    const rating = this.ratingRef.value?.querySelector<HTMLInputElement>('input[selected]')?.value;

    const request: Record<string, unknown> = { context, rating, comment };
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
          console.log(`None 200 response encountered sending feedback to API: ${response.status}`);
        }
      } catch (err) {
        console.log(`Error encountered sending feedback to API: ${err}`);
      }
    }

    this.feedbackFormRef.value?.setAttribute('data-completed', 'true');
  }

  public initialize({ apiUrl, getAccessToken, getContext }: FeedbackOptions) {
    if (apiUrl) {
      this.apiUrl = new URL(apiUrl);
    }

    if (getAccessToken && typeof getAccessToken === 'function') {
      this.getAccessToken = getAccessToken;
    }

    if (getContext && typeof getContext === 'function') {
      this.getContext = getContext;
    }

    const head = document.querySelector('head');
    if (head) {
      render(
        html`<style>
          .adsp-fb {
            z-index: 100;
            font-family: acumin-pro-semi-condensed, helvetica-neue, arial, sans-serif;
          }
          .adsp-fb > *[data-show]:not([data-show='true']) {
            display: none;
          }
          .adsp-fb .adsp-fb-badge {
            z-index: 1;
            background: #0070c4;
            color: #ffffff;
            position: fixed;
            right: 0;
            top: 60vh;
            padding: 16px 8px;
            writing-mode: vertical-rl;
            cursor: pointer;
          }
          .adsp-fb .adsp-fb-form-container {
            z-index: 2;
            background: #ffffff;
            position: fixed;
            right: 16px;
            top: 30vh;
            bottom: 48px;
            border: 1px solid;
            overflow: hidden;
          }
          .adsp-fb .adsp-fb-form {
            display: flex;
            box-sizing: border-box;
            flex-direction: column;
            height: 100%;
            padding: 24px 48px;
            transition: transform 100ms;
          }
          .adsp-fb .adsp-fb-form-comment {
            flex: 1;
            display: flex;
            flex-direction: column;
            margin-top: 24px;
          }

          .adsp-fb .adsp-fb-form-comment textarea {
            margin-top: 12px;
            resize: none;
            min-height: 100px;
            width: 100%;
            flex: 1;
          }
          .adsp-fb .adsp-fb-actions {
            display: flex;
            margin-top: 48px;
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
          .adsp-fb .adsp-fb-sent {
            position: absolute;
            top: 0;
            right: 0;
            height: 100%;
            width: 100%;
            transition: transform 200ms;
            transform: translateX(100%);
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            padding: 24px 48px;
          }
          .adsp-fb .adsp-fb-sent p {
            margin-bottom: auto;
          }
          @media screen and (max-width: 623px) {
            .adsp-fb .adsp-fb-form-container {
              right: 0;
              top: 0;
              bottom: 0;
              left: 0;
              padding: 24px;
              border: 0;
              display: flex;
              flex-direction: column;
            }
          }
          .adsp-fb .adsp-fb-form-container[data-completed='true'] .adsp-fb-form {
            transform: translateX(-100%);
          }
          .adsp-fb .adsp-fb-form-container[data-completed='true'] .adsp-fb-sent {
            transform: none;
          }
        </style>`,
        head
      );
    }

    const body = document.querySelector('body');
    if (body) {
      render(
        html`
          <div class="adsp-fb">
            <div ${ref(this.feedbackBadgeRef)} class="adsp-fb-badge" data-show="true" @click=${this.openFeedbackForm}>
              <span>Feedback</span>
            </div>
            <div ${ref(this.feedbackFormRef)} class="adsp-fb-form-container" data-show="false">
              <form class="adsp-fb-form">
                <h2>Your feedback</h2>
                <fieldset class="adsp-fb-form-rating" ${ref(this.ratingRef)} @change=${this.onRatingChange}>
                  <legend>How is your experience?</legend>
                  <label for="delightful">
                    <input name="rating" type="radio" id="delightful" value="delightful" />
                    Delightful
                  </label>
                  <label for="good">
                    <input name="rating" type="radio" id="good" value="good" />
                    Good
                  </label>
                  <label for="neutral">
                    <input name="rating" type="radio" id="neutral" value="neutral" />
                    Neutral
                  </label>
                  <label for="bad">
                    <input name="rating" type="radio" id="bad" value="bad" />
                    Bad
                  </label>
                  <label for="terrible">
                    <input name="rating" type="radio" id="terrible" value="terrible" />
                    Terrible
                  </label>
                </fieldset>
                <div class="adsp-fb-form-comment">
                  <label for="comment">Please share your comments </label>
                  <textarea id="comment" ${ref(this.commentRef)}></textarea>
                </div>
                <div class="adsp-fb-actions">
                  <button @click=${this.closeFeedbackForm} type="button">Close</button>
                  <button
                    ${ref(this.sendButtonRef)}
                    class="adsp-fb-form-primary"
                    @click=${this.sendFeedback}
                    type="button"
                    disabled
                  >
                    Send feedback
                  </button>
                </div>
              </form>
              <div class="adsp-fb-sent">
                <h2>Your feedback</h2>
                <p>Thank you for sharing your feedback. We will use your input to improve the service.</p>
                <div class="adsp-fb-actions">
                  <button @click=${this.closeFeedbackForm} class="adsp-fb-form-primary" type="button">Close</button>
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

//@ts-expect-error - This is to support the development scaffold.
// Consuming apps should include non-module script element which will import and set global variable.
window.adspFeedback = adspFeedback;

export default adspFeedback;
