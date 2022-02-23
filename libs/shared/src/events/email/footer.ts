export const getFooterPreview = () => {
  return `
  <footer>
  <style>
    .goa-footer-event {
      background-color: #F1F1F1;
      padding-top: 2.5rem;
      padding-top: 3rem;
      padding-bottom: 3rem;
    }
    .goa-footer-event .link {
      padding-left: 4.5rem;
      flex: 5;
      padding-bottom: 1.5rem;
    }
    .goa-footer-event .logo {
      padding-right: 6.75rem;
      flex: 1;
    }
    .goa-footer-event .footer-disclaimer {
      padding-left: 4.5rem;
      padding-right: 5.5rem;
      color: #666666;
      padding-top: 1.75rem;

      font-size: 14px;
      text-align: justify;
    }
    .container {
      display: flex;
    }
    .footer-link-border {
      border-bottom: 1px solid #DCDCDC;
    }
  </style>
  <div class="goa-footer-event">
    <div class="container footer-link-border">
      <div class="link">
        <span>
          Please do not reply to this email.
        </span>
        <br/>
      </div>
      <div class="logo">
        <img
          alt="Government of Alberta"
          src="https://file-service.adsp.alberta.ca/file/v1/files/4b95b597-395f-4f4a-90ba-1d6cf2be0756/download?embed=true"
        />
      </div>
    </div>
    <div class="footer-disclaimer">
      This email was sent from the Government of Alberta and any files transmitted
      with it are confidential and intended solely for the use of the individual
      For entity to whom they are addressed. If you have received this email in
      error please notify the system manager. This message contains confidential
      information and is intended only for the individual named. If you are not
      the named addressee you should not disseminate, distribute or copy this
      e-mail.
    </div>
  </div>
</footer>
`;
};
