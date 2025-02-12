import { FormEntity, FormSubmissionEntity } from './model';

export interface PdfService {
  generateFormPdf(form: FormEntity, submission?: FormSubmissionEntity): Promise<string>;
}

export const SUBMITTED_FORM = 'submitted-form';

const template = `

<body>
  <div class="content">
    <div class="review-item">
      {{#each data.definition.uiSchema.elements }}
        {{#if (isControl this)}}
          <div class="review-item-basic">
            {{> elements element=this data=@root.data.content.data dataSchema=@root.data.definition.dataSchema requiredFields=(requiredField @root.data.definition.dataSchema) }}
          </div>
        {{else}}
          <div class="review-item-section">
            <div class="review-item-header">
              <div class="review-item-title">{{this.label}}</div>
            </div>
            <div class="grid">
                {{#each this.elements }}
                    <div class="grid-padding">
                        {{> elements element=this data=@root.data.content.data dataSchema=@root.data.definition.dataSchema requiredFields=(requiredField @root.data.definition.dataSchema) styles=@root.content.styles }}
                     </div>
                {{/each}}
            </div>
          </div>
        {{/if}}
      {{/each}}
     {{#if (hasTypeControlOrList data.definition.uiSchema )}}
          <div class="review-item-basic">
            {{> elements element=data.definition.uiSchema data=@root.data.content.data dataSchema=@root.data.definition.dataSchema requiredFields=(requiredField @root.data.definition.dataSchema) }}
          </div>
     {{/if}}
    </div>
  </div>
</body>

`;

const additionalStyles = `
<style>
/*
 * The CSS tab is useful for CSS that applies throughout your template i.e. to the header, footer,
 * and body segments. Define your default, common styles for fonts, margins, padding, colours, etc.
 * here.
 *
 * You can always stick all your CSS here, especially if separation of concern is your jam.
 */
div, p {
  margin: 0 0 0 0;
  padding: 0 0 0 0;
}

/*
 * Explicitly set the font size.  This is especially important for both the header and the footer
 * as puppeteer has a quirk that sometimes sets it to 0, making any text in them unreadable.
 */
div, p {
  font-size: 9pt;
  font-weight: normal;
}

/*
* Also, you need to explicitly tell Puppeteer to use colour when generating the
* PDF document, or it will just print out grey tones.  This does not
* apply to SVG, however, which seem to render correctly either way.
*/
html {
 -webkit-print-color-adjust: exact;
}

.clear {
  clear: both;
}

.content {
  padding: 0 1em;
  margin-top: 1.5em;
  box-sizing: border-box;
}

.content .review-item-section {
  background-color: #f1f1f1;
  margin: 0.5rem 0;
  padding: 1rem;
  border: 1px solid #dcdcdc;
  border-radius: 5px;
}

.content .review-item {
  display: flex;
  flex-direction: column;
  border: 1px solid grey;
  border-radius: 0.25rem;
  margin: 0.25rem 0.25rem 1.25rem 0.25rem;
  padding: 0.5rem;
}

.content .review-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}
.content .vertical-flex {
  display: flex;
  flex-direction: column;
}

.content .grid {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: stretch;
}

.content .grid-item {
  flex: 1 1 calc(41% - 1rem);
  margin: 0 3em 0 0;
}
.content .grid-padding {
  display: flex;
  flex: 1 1 calc(91% - 1rem);
  margin-bottom: 1rem;
}

.content .header {
  width: 100%;
  margin-bottom: 1rem;
}

.content .list-item-borderless {
  flex: 1 1 calc(45% - 1rem);
  margin: 0;
}
.content .list-item-borderless-bottom-padding {
  flex: 1 1 calc(45% - 1rem);
}
.content .list-item-basic {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  border: 1px solid #dcdcdc;
  border-radius: 0.25rem;
  padding: 0.75rem;
  width: 95%;
  margin: 0 0 1em 0;
}
.content .list-item-basic-list {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  border: 1px solid #dcdcdc;
  border-radius: 0.25rem;
  padding: 0.75rem;
  width: 95%;
  margin: 0 0 1em 0;
}

.content .list-item-borderless-box {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.375rem 0;
  width: 95%;
}

.content .review-item-title {
  font-size: 1.5rem;
  line-height: 25px;
  font-weight: 300;
}

.content .review-item-basic {
  background-color: #f1f1f1;
  padding: 1rem;
}

.content .goa-card {
  height: 100% !important;
  width: 100% !important;
}

.content img {
  width: 100%;
}
</style>

`;

const header = `
<style>
  .header-wrapper {
    padding-left: 2cm;
    /*
     * The width was determined empirically, for aesthetic reasons,
     * to be about 60% of the page (a4) width of 210mm.
     */
    width: 160mm;
  }
  .header-wrapper p {
    display: inline-block;
    margin-left: 3mm;
    position: relative;
    top: -1.4mm;
    font-size: 8pt;
  }
  .subtitle {
    padding-top: 3mm;
    margin-top: 2mm;
    border-top: 1px solid lightgrey;
  }
  .subtitle span {
    display: inline-block;
  }
  .subtitle span:first-child {
    float: left;
    font-size: 10pt;
  }
  .subtitle span:last-child {
    float: right;
    font-size: 7pt;
    font-weight: bold;
    padding-top: 2px;
  }

</style>
<div class="header-wrapper">

  <!--
    -- Inline SVG
    -- Government of Alberta logo
   -->
  <img width="100px" src="data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='149.351' height='42' viewBox='0 0 149.351 42'%3E%3Cdefs%3E%3Cstyle%3E.a%7Bfill:none;%7D.b%7Bclip-path:url(%23a);%7D.c%7Bfill:%2300aad2;%7D.d%7Bfill:%235f6a72;%7D%3C/style%3E%3CclipPath id='a'%3E%3Crect class='a' width='149.351' height='42'/%3E%3C/clipPath%3E%3C/defs%3E%3Cg class='b'%3E%3Crect class='c' width='13.555' height='13.555' transform='translate(135.796 21.524)'/%3E%3Cpath class='d' d='M63.082,33.088c-1.383.138-2.835.277-4.357.346.553-4.357,2.835-10.373,5.671-9.405,1.66.553.761,5.671-1.314,9.059m-3.527,2.974a3.761,3.761,0,0,1-1.245,0,.851.851,0,0,0,.346-.692v-.553c.761,0,1.936-.138,3.389-.277a4.327,4.327,0,0,1-2.49,1.521M76.844,25.688c1.8-1.66,2.7-1.521,2.9-1.106.484.968-1.591,4.357-5.671,6.224a10.328,10.328,0,0,1,2.766-5.118m66.736,1.66c-.207-3.389-3.181-3.942-3.6-2.974-.138.346,1.106.207,1.106,2.628,0,3.942-4.011,9.129-9.129,9.129-5.532,0-6.985-4.357-7.261-6.432-.207-1.452.138-3.458-2.351-3.181-1.729.207-3.25,3.527-5.463,6.362-1.867,2.42-2.7,2.213-2.282.138.553-2.628,2.7-8.714,5.187-9.129,1.176-.207,1.591,1.8,2.075.553s.069-4.011-2.559-4.011c-1.8,0-3.942,1.936-5.74,4.08-1.521,1.936-9.336,13.416-12.656,10.927-1.521-1.176-1.383-5.878-.415-11.411,3.873-1.521,7.123-1.037,8.921-.138.9.415,1.037.346.622-.622-.553-1.452-3.665-3.734-8.575-2.7-.138,0-.207.069-.346.069.415-1.8.83-3.665,1.383-5.463.484-1.66,1.8-4.5-1.729-4.979-1.106-.207-.622.346-1.037,1.867-.692,2.766-1.521,6.362-2.144,10.028a19.745,19.745,0,0,0-7.538,8.091,38.59,38.59,0,0,0,.9-4.772,1.589,1.589,0,0,0-1.245-1.729c-.761-.207-1.729.138-2.628,1.452-2.144,3.043-4.841,7.815-8.99,9.82-2.974,1.452-4.288,0-4.357-2.282a9.869,9.869,0,0,0,1.521-.553c5.394-2.351,7.192-5.947,5.878-8.16-1.314-2.075-4.979-1.452-7.953,1.66a11.175,11.175,0,0,0-2.7,6.5c-1.245.277-2.628.484-4.219.692,2.49-4.08,2.282-9.613-1.383-10.581-4.288-1.106-6.432,3.043-7.331,6.5.346-3.873.9-7.745,1.591-11.549.346-1.66,1.452-4.5-2.075-4.979-1.106-.207-.968.346-.9,1.867.138,2.075-2.144,14.454-.968,19.848-1.521.484-2.144,1.66-.207,2.835,1.383.83,4.357,1.106,7.331-.346a9.3,9.3,0,0,0,2.766-2.144c1.8-.207,3.665-.553,5.394-.83.277,2.42,1.867,4.219,5.463,3.873,5.118-.484,9.682-6.777,11.411-9.82-.346,3.25-2.42,10.373,1.176,10.028,1.383-.138.83-.346.9-1.591.346-4.288,3.873-7.953,7.4-10.166-.622,5.256-.415,9.958,2.006,11.411,4.426,2.766,10.581-4.5,14.039-8.921-1.729,3.942-2.7,8.921-.138,9.682,3.043.9,5.463-4.219,8.3-8.091.346,2.766,2.213,7.607,9.682,7.607,8.022-.069,13.071-4.91,12.863-10.1m-108.3,8.645A66.439,66.439,0,0,1,27.4,32.534a59.168,59.168,0,0,0,6.777-2.974,54.453,54.453,0,0,0,1.106,6.432m20.4,3.873c-.069-.207-.622.069-1.106,0-1.452-.207-3.389-2.213-3.942-5.463-1.037-5.878-.415-11.687,1.314-20.332.346-1.66,1.452-4.5-2.075-5.048-1.106-.138-.553.415-.83,1.867C47.66,17.32,42.4,21.954,37.149,25.066,36.6,17.735,36.8,9.505,38.186,4.526c1.176-4.219,2.559-3.458.83-4.357s-3.734.277-5.325,3.458S24.839,23.89,13.221,35.439C7.273,41.317,1.879,38.274.842,37.375c-.9-.761-1.176.415-.138,1.591,4.772,5.256,11.826,2.282,14.384-.277,7.054-7.054,15.283-22.268,18.6-28.7a98.251,98.251,0,0,0,.277,16.874,50.129,50.129,0,0,1-8.3,3.181c-1.66.415-2.7,1.106-2.7,1.867s1.106,1.521,2.7,2.282c2.835,1.383,11.2,5.256,13.209,6.5,1.729,1.037,2.628.207,3.112-.9.692-1.452-1.176-2.282-2.974-2.766a60.545,60.545,0,0,1-1.66-9.267c4.219-2.628,8.437-6.086,10.788-10.443C47.522,20.916,46,33.3,49.873,38.482a5.451,5.451,0,0,0,4.564,2.213c.968-.069,1.383-.692,1.245-.83' transform='translate(-0.038 0.124)'/%3E%3C/g%3E%3C/svg%3E"></img>

  <!--
    -- Template Variables:
    -- Use Handlebars variables in your templates as placeholders for data gathered by your application.
    -- When a PDF document is generated, the placeholder is replaced by data, giving applications the
    -- ability to customize documents.  Placeholder names must always start with the prefix data. or they
    -- will be ignored.  Data to be substituted for the placeholders is written as a Json object.  You can
    -- learn all about how Handlebars works here:
    --    https://govalta.github.io/adsp-monorepo/tutorials/pdf-service/introduction.html
    --
    -- See the JSON in the Test Data tab for the examples used here.
    -->
  <p>Form submission</p>
  <div class="subtitle"><span>{{data.definition.name}} (submitted: {{formatDate data.form.submitted}})</span><span>{{data.form.securityClassification}}</span></div>
  <div class="clear" />
</div>
`;

export const SubmittedFormPdfTemplate = {
  id: SUBMITTED_FORM,
  name: 'Submitted Form',
  description: 'Template used to generate a PDF when a form is submitted',
  template,
  additionalStyles,
  header,
};
