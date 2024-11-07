import { FormEntity, FormSubmissionEntity } from './model';

export interface PdfService {
  generateFormPdf(form: FormEntity, submission?: FormSubmissionEntity): Promise<string>;
}

export const SUBMITTED_FORM = 'submitted-form';

const template = `

<body>
  <div class="content">
    <h3>Form summary for form {{data.content.config.id}} </h3>
    <div class="review-item">
      {{#each data.content.config.uiSchema.elements }}
        {{#if (isControl this)}}
          <div class="review-item-basic">
            {{> elements element=this data=@root.data.content.data dataSchema=@root.data.content.config.dataSchema requiredFields=(requiredField @root.data.content.config.dataSchema) }}
          </div>
        {{else}}
          <div class="review-item-section">
            <div class="review-item-header">
              <div class="review-item-title">{{this.label}}</div>
            </div>
            <div class="grid">
                {{#each this.elements }}
                    <div class="grid-padding">
                        {{> elements element=this data=@root.data.content.data dataSchema=@root.data.content.config.dataSchema requiredFields=(requiredField @root.data.content.config.dataSchema) styles=@root.content.styles }}
                     </div>
                {{/each}}
            </div>
          </div>
        {{/if}}
      {{/each}}
     {{#if (hasTypeControlOrList data.content.config.uiSchema )}}
          <div class="review-item-basic">
            {{> elements element=data.content.config.uiSchema data=@root.data.content.data dataSchema=@root.data.content.config.dataSchema requiredFields=(requiredField @root.data.content.config.dataSchema) }}
          </div>
     {{/if}}
    </div>
  </div>
</body>

`;

const additionalStyles = `
        <style>
        @font-face {
            font-family: 'acumin-pro-semi-condensed';
            src: url("https://use.typekit.net/af/3f7b4d/00000000000000003b9acb2d/27/l?subset_id=1&fvd=n4&v=3") format("woff2"), url("https://use.typekit.net/af/3f7b4d/00000000000000003b9acb2d/27/d?subset_id=1&fvd=n4&v=3") format("woff"), url("https://use.typekit.net/af/3f7b4d/00000000000000003b9acb2d/27/a?subset_id=1&fvd=n4&v=3") format("opentype");
            font-style: normal;
            font-weight: 400;
        }

        @font-face {
            font-family: 'acumin-pro-semi-condensed';
            src: url("https://use.typekit.net/af/761912/00000000000000003b9acb2e/27/l?subset_id=1&fvd=i4&v=3") format("woff2"), url("https://use.typekit.net/af/761912/00000000000000003b9acb2e/27/d?subset_id=1&fvd=i4&v=3") format("woff"), url("https://use.typekit.net/af/761912/00000000000000003b9acb2e/27/a?subset_id=1&fvd=i4&v=3") format("opentype");
            font-style: italic;
            font-weight: 400;
        }

        @font-face {
            font-family: 'acumin-pro-semi-condensed';
            src: url("https://use.typekit.net/af/ee7f3d/00000000000000003b9acb33/27/l?subset_id=1&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/ee7f3d/00000000000000003b9acb33/27/d?subset_id=1&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/ee7f3d/00000000000000003b9acb33/27/a?subset_id=1&fvd=n7&v=3") format("opentype");
            font-style: normal;
            font-weight: 700;
        }

        @font-face {
            font-family: 'acumin-pro-semi-condensed';
            src: url("https://use.typekit.net/af/503f80/00000000000000003b9acb34/27/l?subset_id=1&fvd=i7&v=3") format("woff2"), url("https://use.typekit.net/af/503f80/00000000000000003b9acb34/27/d?subset_id=1&fvd=i7&v=3") format("woff"), url("https://use.typekit.net/af/503f80/00000000000000003b9acb34/27/a?subset_id=1&fvd=i7&v=3") format("opentype");
            font-style: italic;
            font-weight: 700;
        }

        @font-face {
            font-family: 'acumin-pro-semi-condensed';
            src: url("https://use.typekit.net/af/e60e87/00000000000000003b9acb31/27/l?subset_id=1&fvd=n6&v=3") format("woff2"), url("https://use.typekit.net/af/e60e87/00000000000000003b9acb31/27/d?subset_id=1&fvd=n6&v=3") format("woff"), url("https://use.typekit.net/af/e60e87/00000000000000003b9acb31/27/a?subset_id=1&fvd=n6&v=3") format("opentype");
            font-style: normal;
            font-weight: 600;
        }

        @page {
            size: letter;
            margin: 25mm 20mm 25mm 20mm;
        }

        html,
        body {
            width: 210mm;
            font-size: 16px;
            font-family: 'acumin-pro-semi-condensed', sans-serif;
        }

        h1 {
            margin: 0;
            padding: 0;
            line-height: 3.5em;
            font-size: 3em;
        }

        h2 {
            margin: 1.5em 0 0;
            padding: 0;
            line-height: 2.75em;
            color: #333;
            font-size: 2.5em;
            font-weight: 400;
        }

        h3 {
            padding: 0;
            line-height: 2em;
            color: #333;
            font-size: 1.5em;
            font-weight: 400;
        }

        h4.groupPadding {
            margin: 0.5rem 0 1.5rem 0!important;
            line-height: 0;
            color: #333;
            font-size: 1.5em;
            font-weight: 400;
        }
        h4 {
            margin: 1.5em 0 0;
            padding: 0;
            line-height: 1.75em;
            color: #333;
            font-size: 1.125em;
            font-weight: 700;
        }

        h5 {
            margin: 1.5em 0 0;
            padding: 0;
            line-height: 1.75em;
            color: #333;
            font-size: 1.125em;
            font-weight: 700;
        }

        p {
            margin: 1.5em 0 0;
            font-size: 1.125em;
            line-height: 1.75em;
        }

        .review-item-section {
            background-color: #f1f1f1;
            margin: 0.5rem 0;
            padding: 1rem;
            border: 1px solid #dcdcdc;
            border-radius: 5px;
        }

        .review-item {
            display: flex;
            flex-direction: column;
            border: 1px solid grey;
            border-radius: 0.25rem;
            margin: 0.25rem 0.25rem 1.25rem 0.25rem;
            padding: 0.5rem;
        }

        .review-item-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
        }
        .vertical-flex {
            display: flex;
            flex-direction: column;
        }

        .grid {
            display: flex;
            flex-direction: column;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: stretch;
        }

        .content {
            padding: 0 1em;
            box-sizing: border-box;
        }

        .grid-item {
            flex: 1 1 calc(41% - 1rem);
            margin: 0 2em 0 0;
        }
        .grid-padding {
            display: flex;
            flex: 1 1 calc(91% - 1rem);
            margin-bottom: 1rem;
        }

        .header {
            width: 100%;
            margin-bottom: 1rem;
        }

        .list-item-borderless {
            flex: 1 1 calc(45% - 1rem);
            margin: 0;
        }
        .list-item-borderless-bottom-padding {
            flex: 1 1 calc(45% - 1rem);
        }
        .list-item-basic {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            border: 1px solid #dcdcdc;
            border-radius: 0.25rem;
            padding: 0.75rem;
            width: 95%;
            margin: 0 0 1em 0;
        }
        .list-item-basic-list {
            display: flex;
            flex-direction: row;
            gap: 1rem;
            border: 1px solid #dcdcdc;
            border-radius: 0.25rem;
            padding: 0.75rem;
            width: 95%;
            margin: 0 0 1em 0;
        }

        .list-item-borderless-box {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            padding: 0.375rem 0;
            width: 95%;
        }

        .review-item-title {
            font-size: 1.5rem;
            line-height: 25px;
            font-weight: 300;
        }

        .review-item-basic {
            background-color: #f1f1f1;
            padding: 1rem;
        }

        .goa-card {
            height: 100% !important;
            width: 100% !important;
        }

        img {
            width: 100%;
        }

        .flex-default {
            flex: 0 1 {{styles.flex.default}};
        }

        @media (min-width: 768px) {
            .flex-md {
                flex-basis: {{styles.flex.md}};
            }
        }

        @media (min-width: 1024px) {
            .flex-lg {
                flex-basis: {{styles.flex.lg}};
            }
        }

        @media (min-width: 1280px) {
            .flex-xl {
                flex-basis: {{styles.flex.xl}};
            }
        }
    </style>

`;

export const SubmittedFormPdfTemplate = {
  id: SUBMITTED_FORM,
  name: 'Submitted Form',
  description: 'Template used to generate a PDF when a form is submitted',
  template,
  additionalStyles,
};
