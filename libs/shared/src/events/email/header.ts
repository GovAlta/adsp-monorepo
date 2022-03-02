export const getHeaderPreview = () => {
  return `
<header>
  <style>
    .goa-header-event-template {
      padding-bottom: 0.875rem;
      padding-top: 0.875rem;
    }
    #goa-callout-custom {
      background-color: #0081a2 !important;
      color: #ffffff;
      padding-left: 7.5rem;
      padding-top: 1.5rem;
      padding-bottom: 1.5rem;
    }
    #goa-callout-custom .title {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0em;
      text-align: left;
      line-height: 3rem;
    }
  </style>
  <div class="goa-header-event-template">
    <div class="goa-logo">
      <img
        alt="Government of Alberta"
        src="https://file-service.adsp.alberta.ca/file/v1/files/4b95b597-395f-4f4a-90ba-1d6cf2be0756/download?embed=true"
      />
    </div>
  </div>
  <div id="goa-callout-custom"><div class="title">Alberta Digital Service Platform</div></div>
</header>
`;
};
