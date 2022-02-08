import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import MonacoEditor from '@monaco-editor/react';
import DOMPurify from 'dompurify';
import { generateMessage } from '@lib/handlebarHelper';
import { getTemplateBody } from '@shared/utils/html';
import debounce from 'lodash.debounce';

const LandingPage = (): JSX.Element => {
  const [subject, setSubject] = useState('asd');
  const [body, setBody] = useState(`
  <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
  <!--[if gte mso 9]>
  <xml>
  <o:OfficeDocumentSettings>
  <o:AllowPNG/>
  <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  <title></title>
  <style type="text/css">
  table, td { color: #000000; } a { color: #cca250; text-decoration: none; } @media (max-width: 480px) { #u_content_image_4 .v-src-width { width: auto !important; } #u_content_image_4 .v-src-max-width { max-width: 57% !important; } #u_content_image_3 .v-container-padding-padding { padding: 46px 10px 10px !important; } #u_content_image_3 .v-src-width { width: auto !important; } #u_content_image_3 .v-src-max-width { max-width: 29% !important; } #u_content_heading_3 .v-container-padding-padding { padding: 10px 20px !important; } #u_content_heading_3 .v-font-size { font-size: 28px !important; } #u_content_text_3 .v-container-padding-padding { padding: 10px 22px 26px !important; } #u_content_heading_2 .v-container-padding-padding { padding: 22px 22px 10px !important; } #u_content_heading_2 .v-font-size { font-size: 24px !important; } }
  @media only screen and (min-width: 620px) {
  .u-row {
  width: 600px !important;
  }
  .u-row .u-col {
  vertical-align: top;
  }

  .u-row .u-col-18 {
  width: 108px !important;
  }

  .u-row .u-col-18p34 {
  width: 110.04px !important;
  }

  .u-row .u-col-63p66 {
  width: 381.96px !important;
  }

  .u-row .u-col-100 {
  width: 600px !important;
  }

  }

  @media (max-width: 620px) {
  .u-row-container {
  max-width: 100% !important;
  padding-left: 0px !important;
  padding-right: 0px !important;
  }
  .u-row .u-col {
  min-width: 320px !important;
  max-width: 100% !important;
  display: block !important;
  }
  .u-row {
  width: calc(100% - 40px) !important;
  }
  .u-col {
  width: 100% !important;
  }
  .u-col > div {
  margin: 0 auto;
  }
  }
  body {
  margin: 0;
  padding: 0;
  }

  table,
  tr,
  td {
  vertical-align: top;
  border-collapse: collapse;
  }

  p {
  margin: 0;
  }

  .ie-container table,
  .mso-container table {
  table-layout: fixed;
  }

  * {
  line-height: inherit;
  }

  a[x-apple-data-detectors='true'] {
  color: inherit !important;
  text-decoration: none !important;
  }

  </style>

  <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->

  </head>

  <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
  <!--[if IE]><div class="ie-container"><![endif]-->
  <!--[if mso]><div class="mso-container"><![endif]-->
  <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align: top">
  <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->

  <div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #111114;">
  <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #111114;"><![endif]-->
  <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
  <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  <table id="u_content_image_4" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:20px 10px;font-family:'Montserrat',sans-serif;" align="left">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
  <td style="padding-right: 0px;padding-left: 0px;" align="center">
  <img align="center" border="0" src="images/image-6.png" alt="Logo" title="Logo" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 44%;max-width: 255.2px;" width="255.2" class="v-src-width v-src-max-width"/>
  </td>
  </tr>
  </table>

  </td>
  </tr>
  </tbody>
  </table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
  </div>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
  </div>
  </div>
  </div>



  <div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
  <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
  <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #fffefe;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
  <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="background-color: #fffefe;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  <table id="u_content_image_3" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:55px 10px 10px;font-family:'Montserrat',sans-serif;" align="left">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
  <td style="padding-right: 0px;padding-left: 0px;" align="center">
  <img align="center" border="0" src="images/image-5.png" alt="Tick Icon" title="Tick Icon" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 14%;max-width: 81.2px;" width="81.2" class="v-src-width v-src-max-width"/>
  </td>
  </tr>
  </table>

  </td>
  </tr>
  </tbody>
  </table>

  <table id="u_content_heading_3" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 55px;font-family:'Montserrat',sans-serif;" align="left">
  <h1 class="v-font-size" style="margin: 0px; line-height: 160%; text-align: center; word-wrap: break-word; font-weight: normal; font-family: 'Montserrat',sans-serif; font-size: 33px;">
  <strong>Requested service is delivered successfully</strong>
  </h1>

  </td>
  </tr>
  </tbody>
  </table>

  <table id="u_content_text_3" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 60px 50px;font-family:'Montserrat',sans-serif;" align="left">
  <div style="color: #444444; line-height: 170%; text-align: center; word-wrap: break-word;">
  <p style="font-size: 14px; line-height: 170%;"><span style="font-size: 16px; line-height: 27.2px;">Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. </span></p>
  </div>

  </td>
  </tr>
  </tbody>
  </table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
  </div>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
  </div>
  </div>
  </div>



  <div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
  <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
  <!--[if (mso)|(IE)]><td align="center" width="108" style="width: 108px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
  <div class="u-col u-col-18" style="max-width: 320px;min-width: 108px;display: table-cell;vertical-align: top;">
  <div style="width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
  <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 0px solid #ffffff;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
  <tbody>
  <tr style="vertical-align: top">
  <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
  <span>&#160;</span>
  </td>
  </tr>
  </tbody>
  </table>

  </td>
  </tr>
  </tbody>
  </table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
  </div>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]><td align="center" width="380" style="background-color: #cca250;width: 380px;padding: 20px;border-top: 1px solid #CCC;border-left: 1px solid #CCC;border-right: 1px solid #CCC;border-bottom: 1px solid #CCC;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
  <div class="u-col u-col-63p66" style="max-width: 320px;min-width: 382px;display: table-cell;vertical-align: top;">
  <div style="background-color: #cca250;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="padding: 20px;border-top: 1px solid #CCC;border-left: 1px solid #CCC;border-right: 1px solid #CCC;border-bottom: 1px solid #CCC;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px;font-family:'Montserrat',sans-serif;" align="left">
  <h1 class="v-font-size" style="margin: 0px; color: #ffffff; line-height: 160%; text-align: center; word-wrap: break-word; font-weight: normal; font-family: 'Montserrat',sans-serif; font-size: 20px;">
  <strong>Delivered Items:</strong>
  </h1>

  </td>
  </tr>
  </tbody>
  </table>

  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
  <div style="color: #f1f8f5; line-height: 200%; text-align: left; word-wrap: break-word;">
  <p style="font-size: 14px; line-height: 200%;"><span style="color: #f7e1b5; font-size: 14px; line-height: 28px;"><strong><span style="font-size: 14px; line-height: 28px;">✓</span></strong>&nbsp;</span> Mailchimp Setup &amp; Integration</p>
  <p style="font-size: 14px; line-height: 200%;"><span style="color: #f7e1b5; font-size: 14px; line-height: 28px;"><strong>✓</strong></span> &nbsp;Contact upload &amp; Segmentation</p>
  <p style="font-size: 14px; line-height: 200%;"><span style="color: #f7e1b5; font-size: 14px; line-height: 28px;">✓</span> &nbsp;Template Design, upload, and setup</p>
  <p style="font-size: 14px; line-height: 200%;"><span style="color: #f7e1b5; font-size: 14px; line-height: 28px;">✓</span> &nbsp;Campaign setup &amp; schedule</p>
  </div>

  </td>
  </tr>
  </tbody>
  </table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
  </div>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]><td align="center" width="110" style="width: 110px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
  <div class="u-col u-col-18p34" style="max-width: 320px;min-width: 110px;display: table-cell;vertical-align: top;">
  <div style="width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
  <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 0px solid #ffffff;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
  <tbody>
  <tr style="vertical-align: top">
  <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
  <span>&#160;</span>
  </td>
  </tr>
  </tbody>
  </table>

  </td>
  </tr>
  </tbody>
  </table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
  </div>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
  </div>
  </div>
  </div>



  <div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
  <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
  <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
  <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  <table id="u_content_heading_2" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:40px 55px 10px;font-family:'Montserrat',sans-serif;" align="left">
  <h1 class="v-font-size" style="margin: 0px; line-height: 160%; text-align: center; word-wrap: break-word; font-weight: normal; font-family: 'Montserrat',sans-serif; font-size: 26px;">
  <strong>Need anything else?</strong>
  </h1>

  </td>
  </tr>
  </tbody>
  </table>

  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px 60px 20px;font-family:'Montserrat',sans-serif;" align="left">
  <div style="color: #444444; line-height: 170%; text-align: center; word-wrap: break-word;">
  <p style="font-size: 14px; line-height: 170%;"><span style="font-size: 16px; line-height: 27.2px;">Please feel free to contact us!</span></p>
  </div>

  </td>
  </tr>
  </tbody>
  </table>

  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 50px;font-family:'Montserrat',sans-serif;" align="left">
  <div align="center">
  <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;font-family:'Montserrat',sans-serif;"><tr><td style="font-family:'Montserrat',sans-serif;" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://unlayer.com/" style="height:47px; v-text-anchor:middle; width:172px;" arcsize="8.5%" stroke="f" fillcolor="#cca250"><w:anchorlock/><center style="color:#FFFFFF;font-family:'Montserrat',sans-serif;"><![endif]-->
  <a href="https://unlayer.com/" target="_blank" style="box-sizing: border-box;display: inline-block;font-family:'Montserrat',sans-serif;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #FFFFFF; background-color: #cca250; border-radius: 4px;-webkit-border-radius: 4px; -moz-border-radius: 4px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;">
  <span style="display:block;padding:14px 33px;line-height:120%;"><strong><span style="font-size: 16px; line-height: 19.2px;">Click Here &rarr;</span></strong></span>
  </a>
  <!--[if mso]></center></v:roundrect></td></tr></table><![endif]-->
  </div>

  </td>
  </tr>
  </tbody>
  </table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
  </div>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
  </div>
  </div>
  </div>



  <div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #111114;">
  <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #111114;"><![endif]-->
  <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
  <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:32px 10px 0px;font-family:'Montserrat',sans-serif;" align="left">
  <div style="color: #ffffff; line-height: 140%; text-align: center; word-wrap: break-word;">
  <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 18px; line-height: 25.2px;"><strong>Company Name</strong></span></p>
  </div>

  </td>
  </tr>
  </tbody>
  </table>

  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
  <div style="color: #b0b1b4; line-height: 180%; text-align: center; word-wrap: break-word;">
  <p style="font-size: 14px; line-height: 180%;">123 San Francisco, CA. United States</p>
  <p style="font-size: 14px; line-height: 180%;">123-456-7890</p>
  </div>

  </td>
  </tr>
  </tbody>
  </table>

  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
  <div align="center">
  <div style="display: table; max-width:211px;">
  <!--[if (mso)|(IE)]><table width="211" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:211px;"><tr><![endif]-->
  <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 21px;" valign="top"><![endif]-->
  <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 21px">
  <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
  <a href="https://facebook.com/" title="Facebook" target="_blank">
  <img src="images/image-1.png" alt="Facebook" title="Facebook" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
  </a>
  </td></tr>
  </tbody></table>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 21px;" valign="top"><![endif]-->
  <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 21px">
  <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
  <a href="https://twitter.com/" title="Twitter" target="_blank">
  <img src="images/image-2.png" alt="Twitter" title="Twitter" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
  </a>
  </td></tr>
  </tbody></table>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 21px;" valign="top"><![endif]-->
  <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 21px">
  <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
  <a href="https://instagram.com/" title="Instagram" target="_blank">
  <img src="images/image-4.png" alt="Instagram" title="Instagram" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
  </a>
  </td></tr>
  </tbody></table>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 0px;" valign="top"><![endif]-->
  <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
  <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
  <a href="https://linkedin.com/" title="LinkedIn" target="_blank">
  <img src="images/image-3.png" alt="LinkedIn" title="LinkedIn" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
  </a>
  </td></tr>
  </tbody></table>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
  </div>
  </div>

  </td>
  </tr>
  </tbody>
  </table>

  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
  <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="82%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #9495a7;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
  <tbody>
  <tr style="vertical-align: top">
  <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
  <span>&#160;</span>
  </td>
  </tr>
  </tbody>
  </table>

  </td>
  </tr>
  </tbody>
  </table>

  <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
  <tr>
  <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 13px;font-family:'Montserrat',sans-serif;" align="left">
  <div style="color: #b0b1b4; line-height: 180%; text-align: center; word-wrap: break-word;">
  <p style="font-size: 14px; line-height: 180%;">&copy; 20XX All Rights Reserved</p>
  </div>

  </td>
  </tr>
  </tbody>
  </table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
  </div>
  <!--[if (mso)|(IE)]></td><![endif]-->
  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
  </div>
  </div>
  </div>


  <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
  </td>
  </tr>
  </tbody>
  </table>
  <!--[if mso]></div><![endif]-->
  <!--[if IE]></div><![endif]-->
  </body>

  </html>
  `);
  const [subjectPreview, setSubjectPreview] = useState('');

  useEffect(() => {
    if (subject) {
      setSubjectPreview(subject);
    }
  }, []);
  const eventTemplateEditHintText =
    "*GOA default header and footer wrapper is applied if the template doesn't include proper <html> opening and closing tags";
  const debouncedSave = useCallback(
    debounce((value) => setSubjectPreview(value), 1000),
    [] // will be created only once initially
  );
  return (
    <NotificationTemplateContainer>
      <EditTemplateContainer>
        <Edit>
          <h3>Edit an email template</h3>
          <GoAForm>
            <h4>Subject</h4>
            <GoAFormItem>
              <MonacoDiv>
                <MonacoEditor
                  data-testid="templateForm-subject"
                  height={50}
                  language="handlebars"
                  value={subject}
                  onChange={(value) => {
                    setSubject(value);
                    debouncedSave(value);
                  }}
                  options={{
                    wordWrap: 'off',
                    lineNumbers: 'off',
                    scrollbar: { horizontal: 'hidden', vertical: 'hidden' },
                    find: {
                      addExtraSpaceOnTop: false,
                      autoFindInSelection: 'never',
                      seedSearchStringFromSelection: false,
                      overviewRulerBorder: false,
                    },
                    minimap: { enabled: false },
                    renderLineHighlight: 'none',
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                  }}
                />
              </MonacoDiv>
            </GoAFormItem>
            <h4>Body</h4>
            <GoAFormItem helpText={eventTemplateEditHintText}>
              <MonacoDiv>
                <MonacoEditor
                  data-testid="templateForm-body"
                  height={200}
                  value={body}
                  onChange={(value) => setBody(value)}
                  language="handlebars"
                  options={{
                    tabSize: 2,
                    lineNumbers: 'off',
                    minimap: { enabled: false },
                    overviewRulerBorder: false,
                    lineHeight: 25,
                    renderLineHighlight: 'none',
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                  }}
                />
              </MonacoDiv>
            </GoAFormItem>
            <div
              style={{
                display: 'flex',
                justifyContent: 'right',
                gap: '1rem',
              }}
            >
              <GoAButton data-testid="event-form-cancel" buttonType="tertiary" type="button">
                Cancel
              </GoAButton>
              <GoAButton buttonType="primary" data-testid="template-form-save" type="submit">
                Save
              </GoAButton>
            </div>
          </GoAForm>
        </Edit>
      </EditTemplateContainer>
      <PreviewTemplateContainer>
        <Preview>
          <h3>Subject</h3>
          <div
            style={{
              backgroundColor: 'white',
              paddingLeft: '1rem',
              marginRight: '2rem',
              overflow: 'scroll auto',
              height: '100%',
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(subjectPreview),
            }}
          ></div>
          <h3>Email Preview</h3>
          <div
            style={{
              backgroundColor: 'white',
              overflow: 'scroll auto',
              marginRight: '2rem',
              height: '30rem',
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(generateMessage(getTemplateBody(body), {})),
            }}
          ></div>
        </Preview>
      </PreviewTemplateContainer>
    </NotificationTemplateContainer>
  );
};

const NotificationTemplateContainer = styled.div`
  display: flex;
  /* padding-right: 3rem; */
  padding-left: 3rem;
  /* flex-direction: row; */
  width: 100%;
  /* height: auto; */
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
`;
const MonacoDiv = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
`;

const PreviewTemplateContainer = styled.div`
  width: 60%;
  margin-left: 2rem;
  background-color: #00000075;
`;
const Preview = styled.div`
  padding-top: 4rem;
  padding-left: 2rem;
`;
const Edit = styled.div`
  padding-top: 4rem;
`;
const EditTemplateContainer = styled.div`
  width: 40%;
  margin-right: 3rem;
`;
export default LandingPage;
