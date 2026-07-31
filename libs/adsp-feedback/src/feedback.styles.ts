export const feedbackStyles = `          .adsp-fb-root {
            --adsp-fb-color-text: #333333;
            --adsp-fb-color-surface: #ffffff;
            --adsp-fb-color-primary: #0070c4;
            --adsp-fb-color-primary-hover: #004f84;
            --adsp-fb-color-primary-selected: #0081a2;
            --adsp-fb-color-focus: #feba35;
            --adsp-fb-color-muted: #666666;
            --adsp-fb-color-border: #cccccc;
            --adsp-fb-color-error: #d8292f;
            --adsp-fb-color-hover-surface: #f1f1f1;
            --adsp-fb-color-overlay: rgba(0, 0, 0, 0.5);
            --adsp-fb-color-shadow: rgba(0, 0, 0, 0.1);
            --adsp-fb-font-family: acumin-pro-semi-condensed, helvetica-neue, arial, sans-serif;
            --adsp-fb-font-size-body: 1.125rem;
            --adsp-fb-font-size-input: 1rem;
            --adsp-fb-font-size-small: 0.875rem;
            --adsp-fb-font-size-title: 1.5rem;
            --adsp-fb-line-height-body: 1.5;
            --adsp-fb-line-height-content: 1.75rem;
            --adsp-fb-line-height-title: 1.5rem;
            --adsp-fb-font-weight-regular: 400;
            --adsp-fb-font-weight-bold: 700;
            --adsp-fb-space-xs: 0.25rem;
            --adsp-fb-space-s: 0.5rem;
            --adsp-fb-space-m: 0.75rem;
            --adsp-fb-space-l: 1rem;
            --adsp-fb-space-xl: 1.5rem;
            --adsp-fb-space-2xl: 2rem;
            --adsp-fb-radius: 0.25rem;
            --adsp-fb-radius-panel: 3px;
            --adsp-fb-border-width: 2px;
            --adsp-fb-shadow: 0 2px 3px var(--adsp-fb-color-shadow);
            --adsp-fb-shadow-top: 0 2px 3px var(--adsp-fb-color-shadow);
            --adsp-fb-shadow-bottom: -2px -3px 3px var(--adsp-fb-color-shadow);
            --adsp-fb-badge-color: #0081a2;
            --adsp-fb-badge-hover-color: #004f84;
            --adsp-fb-badge-font-family: acumin-pro-semi-condensed, helvetica-neue, arial, sans-serif;
            --adsp-fb-badge-font-size: 1.125rem;
            --adsp-fb-badge-radius: var(--adsp-fb-radius);
          }
          .adsp-fb-root[data-design-system='2.0'] {
            --adsp-fb-color-text: var(--goa-color-text-default, #333333);
            --adsp-fb-color-surface: var(--goa-color-greyscale-white, #ffffff);
            --adsp-fb-color-primary: var(--goa-color-interactive-default, #0070c4);
            --adsp-fb-color-primary-hover: var(--goa-color-interactive-hover, #004f84);
            --adsp-fb-color-primary-selected: var(--goa-color-interactive-default, #0070c4);
            --adsp-fb-color-focus: var(--goa-color-interactive-focus, #feba35);
            --adsp-fb-color-muted: var(--goa-color-text-secondary, #666666);
            --adsp-fb-color-border: var(--goa-color-greyscale-300, #dcdcdc);
            --adsp-fb-color-error: var(--goa-color-emergency-default, #d8292f);
            --adsp-fb-color-hover-surface: var(--goa-color-greyscale-100, #f1f1f1);
            --adsp-fb-color-overlay: rgba(0, 0, 0, 0.48);
            --adsp-fb-color-shadow: rgba(0, 0, 0, 0.16);
            --adsp-fb-font-family: var(--goa-typography-body-font-family, var(--goa-font-family-sans-serif, 'Noto Sans', Arial, sans-serif));
            --adsp-fb-font-size-body: var(--goa-typography-body-m-font-size, 1rem);
            --adsp-fb-font-size-input: var(--goa-typography-body-m-font-size, 1rem);
            --adsp-fb-font-size-small: var(--goa-typography-body-s-font-size, 0.875rem);
            --adsp-fb-font-size-title: var(--goa-typography-heading-m-font-size, 1.5rem);
            --adsp-fb-line-height-body: var(--goa-typography-body-m-line-height, 1.5);
            --adsp-fb-line-height-content: var(--goa-typography-body-m-line-height, 1.5rem);
            --adsp-fb-line-height-title: var(--goa-typography-heading-m-line-height, 2rem);
            --adsp-fb-font-weight-regular: var(--goa-typography-body-m-font-weight, 400);
            --adsp-fb-font-weight-bold: var(--goa-typography-heading-m-font-weight, 700);
            --adsp-fb-space-xs: var(--goa-space-xs, 0.25rem);
            --adsp-fb-space-s: var(--goa-space-s, 0.5rem);
            --adsp-fb-space-m: var(--goa-space-m, 0.75rem);
            --adsp-fb-space-l: var(--goa-space-l, 1rem);
            --adsp-fb-space-xl: var(--goa-space-xl, 1.5rem);
            --adsp-fb-space-2xl: var(--goa-space-2xl, 2rem);
            --adsp-fb-radius: var(--goa-border-radius-m, 0.25rem);
            --adsp-fb-radius-panel: var(--goa-border-radius-m, 0.25rem);
            --adsp-fb-border-width: var(--goa-border-width-m, 2px);
            --adsp-fb-shadow: var(--goa-shadow-m, 0 0.5rem 1rem var(--adsp-fb-color-shadow));
            --adsp-fb-shadow-top: var(--adsp-fb-shadow);
            --adsp-fb-shadow-bottom: var(--adsp-fb-shadow);
            --adsp-fb-badge-radius: var(--goa-border-radius-l, 0.5rem);
          }
          .adsp-fb-root .adsp-fb-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: var(--adsp-fb-color-overlay); /* Semi-transparent black */
            z-index: 1000; /* Ensure it overlays other content */
            visibility: hidden;
          }
          .adsp-fb img:focus-visible {
            border-radius: var(--adsp-fb-radius);
            outline: var(--adsp-fb-color-focus) solid 3px;
          }
          .adsp-fb .feedback-close-button:hover,
          .adsp-fb .feedback-close-button:active,
          .adsp-fb .feedback-close-button:focus {
            background-color: var(--adsp-fb-color-hover-surface);
            border-radius: var(--adsp-fb-radius);
          }

          .adsp-fb .feedback-close-button:active {
            transform: translateY(2px);
          }

          .adsp-fb {
            z-index: 999;
            font-family: var(--adsp-fb-font-family);
            line-height: var(--adsp-fb-line-height-body);
            font-size: var(--adsp-fb-font-size-body);
            color: var(--adsp-fb-color-text);
          }
          .adsp-fb *,
          .adsp-fb *::before,
          .adsp-fb *::after {
            box-sizing: border-box;
            font-family: inherit;
          }
          .adsp-fb h3 {
            color: var(--adsp-fb-color-text);
            font-family: inherit;
            margin-top: 0px !important;
          }
          .adsp-fb p,
          .adsp-fb label,
          .adsp-fb span {
            color: var(--adsp-fb-color-text);
            font-family: inherit;
            font-size: var(--adsp-fb-font-size-body);
          }
          .adsp-fb > *[data-show]:not([data-show='true']) {
            display: none;
          }
          .adsp-fb .adsp-fb-badge {
            z-index: 10;
            background: var(--adsp-fb-badge-color);
            color: #ffffff;
            font-family: var(--adsp-fb-badge-font-family);
            font-size: var(--adsp-fb-badge-font-size);
            position: fixed;
            right: 0;
            top: 60vh;
            padding: var(--adsp-fb-space-l) var(--adsp-fb-space-s);
            writing-mode: vertical-rl;
            cursor: pointer;
            border-radius: 0 var(--adsp-fb-badge-radius) var(--adsp-fb-badge-radius) 0;
            transform: rotate(-180deg);
            display: block;
          }
          .adsp-fb .adsp-fb-badge span {
            color: #ffffff;
            font-size: inherit;
          }
          .adsp-fb .adsp-fb-badge:hover {
            border-color: var(--adsp-fb-badge-hover-color);
            background-color: var(--adsp-fb-badge-hover-color);
          }
          .adsp-fb .adsp-fb-badge:focus {
            border-color: var(--adsp-fb-badge-hover-color);
            background-color: var(--adsp-fb-badge-hover-color);
          }

          .adsp-fb .adsp-fb-badge:active {
            outline: initial;
            box-shadow: 0 0 0 3px var(--adsp-fb-color-focus);
          }

          .adsp-fb .adsp-fb-badge:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px var(--adsp-fb-color-focus);
          }

          .adsp-fb .adsp-fb-form-container {
            z-index: 2;
            position: fixed;
            background: var(--adsp-fb-color-surface);
            width: 640px;
            left: 50%;
            top: 10vh;
            border: 1px solid var(--adsp-fb-color-border);
            border-radius: var(--adsp-fb-radius-panel);
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
            padding-left: var(--adsp-fb-space-xl);
            align-items: center;
            height: 74px;
          }
          .adsp-fb .adsp-fb-container-heading > img {
            cursor: pointer;
          }
          .adsp-fb .adsp-fb-form {
            display: flex;
            box-sizing: border-box;
            flex-direction: column;
            padding: 0 0 var(--adsp-fb-space-xl) var(--adsp-fb-space-xl);
            transition: transform 0.001ms;
          }
          .adsp-fb .adsp-fb-start .adsp-fb-form {
            padding-right: var(--adsp-fb-space-xl);
          }
          .adsp-fb .adsp-fb-start .adsp-fb-actions {
            padding-right: 0;
          }
          .adsp-fb .adsp-fb-form label {
            font-weight: var(--adsp-fb-font-weight-regular);
            line-height: 24px;
          }
          .adsp-fb .adsp-fb-form b {
            font-weight: var(--adsp-fb-font-weight-bold);
          }
          .adsp-fb .adsp-fb-content {
            max-height: 465px;
            overflow-y: auto;
            overflow-x: hidden;
            flex: 1;
            padding-right: var(--adsp-fb-space-l);
            padding-top: 36px;
            margin-bottom: var(--adsp-fb-space-xs);
            padding-bottom: 0px !important;
          }
          .adsp-fb .adsp-fb-form-rating {
            display: flex;
            flex-direction: row;
            gap: var(--adsp-fb-space-2xl);
            border: 0;
            margin-top: var(--adsp-fb-space-m);
            justify-content: space-between;
            width: 98%;
          }
          .adsp-fb .adsp-fb-form-rating > div > img {
            width: 46px;
            height: 46px;
          }
          .adsp-fb .adsp-fb-form-rating > div > img:first-child {
            padding-left: 0px;
          }
          .adsp-fb .adsp-fb-tooltip-text {
            visibility: hidden;
            margin-left: 25px;
            background-color: var(--adsp-fb-color-muted);
            color: #fff;
            text-align: center;
            border-radius: 5px;
            padding: var(--adsp-fb-space-s) var(--adsp-fb-space-m);
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
          .adsp-fb .adsp-fb-tooltip-text:before {
            content: '';
            position: absolute;
            top: -10px;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            transform: translateX(-50%);
            -webkit-transform: translateX(-50%);
            border-color: transparent transparent var(--adsp-fb-color-muted) transparent;
          }
          .adsp-fb .adsp-fb-tooltip-text.adsp-fb-tooltip-modified:before {
            left: 40%;
          }
          .adsp-fb .adsp-fb-rating-text {
            display: none;
          }
          .adsp-fb .adsp-fb-form-comment {
            display: flex;
            flex-direction: column;
            margin-bottom: var(--adsp-fb-space-m);
          }
          .adsp-fb .adsp-fb-form-comment > label {
            margin-top: var(--adsp-fb-space-2xl);
          }
          .adsp-fb .adsp-fb-form-comment span {
            color: var(--adsp-fb-color-muted);
            font-size: var(--adsp-fb-font-size-small);
          }

          .adsp-fb .adsp-fb-form-comment textarea {
            font-family: inherit;
            font-size: var(--adsp-fb-font-size-input);
            color: var(--adsp-fb-color-text);
            margin-top: var(--adsp-fb-space-m);
            margin-left: 3px;
            resize: none;
            min-height: 100px;
            width: 98%;
            border-radius: var(--adsp-fb-radius-panel);
            cursor: text;
            padding: 10px var(--adsp-fb-space-s);
            box-sizing: border-box;
            outline: none;
          }
          .adsp-fb .adsp-fb-form-comment textarea:hover {
            box-shadow: 0 0 0 var(--adsp-fb-border-width) var(--adsp-fb-color-primary-hover);
          }
          .adsp-fb .adsp-fb-form-comment textarea:focus {
            box-shadow: 0 0 0 3px var(--adsp-fb-color-focus);
          }
          .adsp-fb .adsp-fb-form-comment textarea.error {
            box-shadow: 0 0 0 var(--adsp-fb-border-width) var(--adsp-fb-color-error);
            border: 1px solid var(--adsp-fb-color-error);
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
            padding-right: var(--adsp-fb-space-xl);
            margin-top: var(--adsp-fb-space-xl);
          }
          .adsp-fb .adsp-fb-success-actions {
            padding-right: 0px;
          }

          .adsp-fb button {
            display: inline-flex;
            cursor: pointer;
            border-radius: var(--adsp-fb-radius);
            box-sizing: border-box;
            font-size: 1.25rem;
            font-weight: var(--adsp-fb-font-weight-regular);
            height: 2.625rem;
            line-height: 100%;
            padding: 0 0.75rem;
            gap: 0.5rem;
            align-items: center;
            justify-content: center;
            border: var(--adsp-fb-border-width) solid var(--adsp-fb-color-primary);
            color: var(--adsp-fb-color-primary);
          }
          .adsp-fb button:active {
            transform: translateY(2px);
          }

          .adsp-fb button:first-child {
            margin-left: auto !important;
          }
          .adsp-fb button.adsp-fb-form-primary {
            border: var(--adsp-fb-border-width) solid var(--adsp-fb-color-primary);
            margin-left: var(--adsp-fb-space-s);
            background: var(--adsp-fb-color-primary);
            color: #ffffff;
          }

          .adsp-fb button.adsp-fb-form-primary:focus-visible {
            border-radius: var(--adsp-fb-radius);
            box-shadow: 0 0 0 3px var(--adsp-fb-color-focus);
            outline: var(--adsp-fb-color-focus) solid 1px;
          }

          .adsp-fb button:hover {
            border-color: var(--adsp-fb-color-primary-hover);
            background-color: var(--adsp-fb-color-primary-hover);
          }

          .adsp-fb button:focus:active {
            border-color: var(--adsp-fb-color-primary-hover);
            background-color: var(--adsp-fb-color-primary-hover);
            box-shadow: 0 0 0 3px var(--adsp-fb-color-focus);
          }

          .adsp-fb button[disabled] {
            pointer-events: none;
            opacity: 0.5;
          }

          .adsp-fb button.adsp-fb-form-secondary {
            border: var(--adsp-fb-border-width) solid var(--adsp-fb-color-primary);
            background-color: var(--adsp-fb-color-surface);
            color: var(--adsp-fb-color-primary);
          }
          .adsp-fb button.adsp-fb-form-secondary:focus-visible {
            border-radius: var(--adsp-fb-radius);
            box-shadow: 0 0 0 3px var(--adsp-fb-color-focus);
            outline: var(--adsp-fb-color-focus) solid 1px;
          }

          .adsp-fb button.adsp-fb-form-secondary:hover {
            border-color: var(--adsp-fb-color-primary-hover);
            color: var(--adsp-fb-color-primary-hover);
            background-color: var(--adsp-fb-color-hover-surface);
          }
          .adsp-fb button.adsp-fb-form-secondary:focus,
          .adsp-fb button.adsp-fb-form-secondary:active {
            border-color: var(--adsp-fb-color-primary-hover);
            background-color: var(--adsp-fb-color-hover-surface);
            border-radius: var(--adsp-fb-radius);
            border: 1px solid var(--adsp-fb-color-primary-hover);
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
            padding: var(--adsp-fb-space-xl) var(--adsp-fb-space-xl);
          }
          .adsp-fb .adsp-fb-rating-item {
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
          .adsp-fb .adsp-fb-radios {
            margin-top: var(--adsp-fb-space-l);
            margin-bottom: var(--adsp-fb-space-l);
            display: flex;
            flex-direction: row;
          }
          .adsp-fb .adsp-fb-radio-span {
            display: flex;
            align-items: center;
          }
          .adsp-fb .adsp-fb-radio-span:focus-visible {
            border-radius: var(--adsp-fb-radius);
            border: 1px solid var(--adsp-fb-color-focus);
            outline: var(--adsp-fb-color-focus) solid 1px;
          }
          .adsp-fb .adsp-fb-rating-icon {
            display: block !important;
            width: 46px !important;
            min-width: 46px !important;
            max-width: 46px !important;
            height: 46px !important;
            min-height: 46px !important;
            max-height: 46px !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            filter: none !important;
            object-fit: contain !important;
            cursor: pointer;
            transform: translateZ(0);
            will-change: transform, color;
            transition: transform 0.3s ease-in-out color 0.3s ease;
            transition:
              -webkit-transform 0.3s ease-in-out,
              color 0.3s ease;
          }

          .adsp-fb .title {
            color: var(--adsp-fb-color-text);
            font-size: var(--adsp-fb-font-size-title);
            font-weight: var(--adsp-fb-font-weight-bold);
            line-height: var(--adsp-fb-line-height-title);
            text-align: left;
            margin-bottom: 0px;
          }

          .adsp-fb .help-text {
            color: var(--adsp-fb-color-text);
            font-size: var(--adsp-fb-font-size-body);
            font-weight: var(--adsp-fb-font-weight-regular);
            margin-top: 4px;
            margin-bottom: 12px;
            line-height: var(--adsp-fb-line-height-content);
          }
          .adsp-fb .adsp-fb-radio-container {
            display: flex;
            flex-direction: column;
            cursor: pointer;
          }
          .adsp-fb .adsp-fb-radio-container span {
            color: var(--adsp-fb-color-muted);
            font-size: var(--adsp-fb-font-size-small);
          }
          .adsp-fb .adsp-fb-radio {
            appearance: none;
            width: 24px;
            height: 24px;
            border: var(--adsp-fb-border-width) solid var(--adsp-fb-color-border);
            border-radius: 50%;
            position: relative;
            background-color: var(--adsp-fb-color-surface);
            transition: box-shadow 100ms ease-in-out;
            cursor: pointer;
          }
          .adsp-fb .adsp-fb-radio *,
          .adsp-fb .adsp-fb-radio *:before,
          .adsp-fb .adsp-fb-radio *:after {
            box-sizing: border-box;
          }

          .adsp-fb .adsp-fb-radio:not(:checked) {
            border: 1px solid var(--adsp-fb-color-muted);
          }

          .adsp-fb .adsp-fb-radio:checked:hover {
            border: 7px solid var(--adsp-fb-color-primary-hover);
            box-shadow: 0 0 0 1px var(--adsp-fb-color-primary-hover);
          }

          .adsp-fb .adsp-fb-radio:hover,
          .adsp-fb .adsp-fb-radio:focus-visible,
          .adsp-fb .adsp-fb-radio:focus:active {
            outline: initial;
            border: 1px solid var(--adsp-fb-color-primary-hover);
            box-shadow: 0 0 0 1px var(--adsp-fb-color-primary-hover);
          }

          .adsp-fb .adsp-fb-radio:hover:active,
          .adsp-fb .adsp-fb-radio:hover:focus {
            box-shadow: 0 0 0 3px var(--adsp-fb-color-focus);
          }

          .adsp-fb .adsp-fb-radio:checked {
            border: 7px solid var(--adsp-fb-color-primary);
          }
          .adsp-fb .adsp-fb-radio.error {
            border: 1px solid var(--adsp-fb-color-error);
            box-shadow: 0 0 0 1px var(--adsp-fb-color-error);
          }
          .adsp-fb .adsp-fb-radio-label {
            color: var(--adsp-fb-color-text);
            font-size: var(--adsp-fb-font-size-body);
            padding: 0 var(--adsp-fb-space-s);
            font-weight: normal;
            cursor: pointer;
          }
          .adsp-fb .errorText {
            color: var(--adsp-fb-color-text);
            font-size: var(--adsp-fb-font-size-body);
          }
          .adsp-fb .errorButton {
            padding-top: 4px;
          }
          .adsp-fb .successButton {
            margin-top: var(--adsp-fb-space-xl);
          }

          .adsp-fb .styled-hr {
            border: none;
            height: 1px;
            background-color: var(--adsp-fb-color-border);
            margin: 0;
          }

          /* Top-facing shadow */
          .adsp-fb .styled-hr-top {
            box-shadow: var(--adsp-fb-shadow-top);
          }

          /* Bottom-facing shadow */
          .adsp-fb .styled-hr-bottom {
            box-shadow: var(--adsp-fb-shadow-bottom);
          }

          .adsp-fb .hr-width {
            width: 98%;
            margin: 0;
          }
          .adsp-fb .full-width-hr-container {
            margin-left: calc(-1 * var(--adsp-fb-space-xl));
          }

          .adsp-fb .p-error {
            color: var(--adsp-fb-color-text);
            font-size: var(--adsp-fb-font-size-body);
            font-weight: var(--adsp-fb-font-weight-regular);

            line-height: var(--adsp-fb-line-height-content);
            margin: 0 1.5rem 1rem 1.5rem;
          }
          .adsp-fb h3.h3-error {
            margin: 0 !important;
            margin-block-start: 0 !important;
            margin-block-end: 0 !important;
          }
          .adsp-fb .h3-sub-title {
            color: var(--adsp-fb-color-text);
            font-size: var(--adsp-fb-font-size-title);
            font-weight: var(--adsp-fb-font-weight-regular);
            line-height: var(--adsp-fb-line-height-title);
            margin-top: 0;
            margin-bottom: 0;
            padding-top: 36px !important;
          }
          .adsp-fb .h3-success {
            color: var(--adsp-fb-color-text);
            font-size: var(--adsp-fb-font-size-title);
            font-weight: var(--adsp-fb-font-weight-regular);
            line-height: var(--adsp-fb-line-height-title);
            margin-bottom: 0;
          }
          .adsp-fb .h3-success img {
            vertical-align: baseline;
          }
          .adsp-fb .p-content {
            color: var(--adsp-fb-color-text);
            font-size: var(--adsp-fb-font-size-body);
            font-weight: var(--adsp-fb-font-weight-regular);
            line-height: var(--adsp-fb-line-height-content);
            margin: 0;
          }
          .adsp-fb .p-content > a,
          .adsp-fb .p-content > a:link,
          .adsp-fb .p-content > a:visited {
            color: var(--adsp-fb-color-primary);
          }

          .adsp-fb .adsp-fb-sent .p-content a {
            color: var(--adsp-fb-color-primary);
            text-decoration: underline;
          }
          .adsp-fb .adsp-fb-sent button.adsp-fb-form-primary {
          }
          .adsp-fb .inline-error {
            display: none;
            align-items: center;
            color: var(--adsp-fb-color-error);
            gap: 0.5rem;
          }
          .adsp-fb .inline-error.visible {
            display: flex;
            visibility: visible;
          }
          .adsp-fb .inline-error p {
            margin: 0;
            color: var(--adsp-fb-color-error);
          }
          @media screen and (max-width: 767px) {
            .adsp-fb div.adsp-fb-form-container {
            }
            .adsp-fb .adsp-fb-badge {
              top: auto;
              bottom: 12vh;
              font-size: 12px;
              padding: 12px 0;
              line-height: var(--adsp-fb-line-height-title);
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
            .adsp-fb .adsp-fb-main {
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
            }
            .adsp-fb .adsp-fb-actions > button {
              width: 100%;
              margin-top: 12px;
            }
            .adsp-fb button.adsp-fb-form-primary {
              margin-left: 0;
            }
            .adsp-fb .adsp-fb-container-heading {
              height: 55px !important;
            }
            .adsp-fb .adsp-fb-rating-item {
              flex-direction: row;
              gap: 6px;
            }
            .adsp-fb .adsp-fb-form-rating {
              flex-direction: column-reverse;
              gap: 16px;
            }
            .adsp-fb .adsp-fb-form-rating > div {
              display: flex;
              flex-direction: row;
              align-items: center;
            }
            .adsp-fb .adsp-fb-form-rating > div > img {
              height: 32px !important;
              width: 32px !important;
              min-width: 32px !important;
              max-width: 32px !important;
              min-height: 32px !important;
              max-height: 32px !important;
              margin-right: 8px;
            }
            .adsp-fb .adsp-fb-tooltip-text {
              visibility: hidden;
              opacity: 0;
            }
            .adsp-fb .adsp-fb-rating-text {
              padding-top: 12px;
              cursor: pointer;
              margin-bottom: 0px !important;
              display: block;
              padding: 0;
            }
            .adsp-fb .adsp-fb-rating-text:hover {
              color: var(--adsp-fb-color-primary-hover);
            }
          }
          @media screen and (max-height: 800px) {
            .adsp-fb .adsp-fb-form-container {
              top: 16px;
            }
          }

          .adsp-fb .char-count {
            display: block;
            font-size: var(--adsp-fb-font-size-small);
            color: var(--adsp-fb-color-muted);
            text-align: right;
            margin-top: 4px;
          }

          .adsp-fb .char-warning {
            display: none;
            font-size: var(--adsp-fb-font-size-small);
            color: var(--adsp-fb-color-error);
            text-align: right;
            margin-top: 4px;
          }

          .adsp-fb .char-warning.visible {
            display: block;
          }
`;
