import { QuoteEmailData } from '../types/webhook';

interface QuoteEmailTemplateProps {
  data: QuoteEmailData;
}

export default function QuoteEmailTemplate({ data }: QuoteEmailTemplateProps) {
  const { event, lineItems, total } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Fast Mold Testing Co.</title>
        <meta name="description" content="Mold Inspection Quote">
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          body {
            margin: 0;
            padding: 0;
            width: 100%;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            line-height: 1.5;
            color: #1a202c;
          }

          .wrapper {
            width: 100%;
            background-color: #f7fafc;
            padding: 32px 0;
          }

          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 24px;
          }

          .header {
            text-align: center;
            margin-bottom: 32px;
          }

          .logo {
            width: 160px;
            height: auto;
          }

          .content {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .title {
            font-size: 24px;
            font-weight: 600;
            color: #1a202c;
            margin: 0 0 8px 0;
          }

          .subtitle {
            font-size: 14px;
            color: #718096;
            margin: 0 0 24px 0;
          }

          .section {
            margin-bottom: 24px;
          }

          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a202c;
            margin: 0 0 12px 0;
          }

          .info-table {
            width: 100%;
            border-collapse: collapse;
          }

          .info-table td {
            padding: 8px 0;
            font-size: 14px;
            color: #4a5568;
          }

          .info-table td:first-child {
            font-weight: 500;
            width: 120px;
          }

          .services-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }

          .services-table th {
            background-color: #f7fafc;
            padding: 12px;
            font-size: 12px;
            font-weight: 600;
            color: #4a5568;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
          }

          .services-table td {
            padding: 12px;
            font-size: 14px;
            color: #1a202c;
            border-bottom: 1px solid #e2e8f0;
          }

          .services-table .qty-col {
            text-align: center;
            width: 60px;
          }

          .services-table .price-col {
            text-align: right;
            width: 100px;
          }

          .services-table .total-col {
            text-align: right;
            width: 100px;
            font-weight: 500;
          }

          .total-row {
            background-color: #f7fafc;
          }

          .total-row td {
            padding: 16px 12px;
            font-weight: 600;
            border-bottom: none;
          }

          .notes-box {
            background-color: #f7fafc;
            border-left: 4px solid #0ea5e9;
            padding: 16px;
            border-radius: 4px;
            margin-top: 24px;
          }

          .notes-box p {
            margin: 0;
            font-size: 14px;
            color: #4a5568;
            line-height: 1.6;
          }

          .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 32px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
          }

          .footer p {
            margin: 8px 0;
          }

          .footer a {
            color: #718096;
            text-decoration: none;
          }

          .accept-button {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff;
            font-size: 16px;
            font-weight: 600;
            padding: 14px 32px;
            border-radius: 6px;
            text-decoration: none;
            margin: 24px 0;
            transition: background-color 0.2s;
          }

          .accept-button:hover {
            background-color: #059669;
          }

          .button-container {
            text-align: center;
            margin: 32px 0;
          }

          @media only screen and (max-width: 600px) {
            .container {
              padding: 0 16px;
            }

            .content {
              padding: 24px;
            }

            .services-table th,
            .services-table td {
              padding: 8px;
              font-size: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <img
                src="https://fastmoldtesting.com/media/img/logo-.webp"
                alt="Fast Mold Testing Co."
                class="logo"
              >
            </div>
            <div class="content">
              <h1 class="title">Mold Inspection Quote</h1>
              <p class="subtitle">Generated on ${formatDate(event.created_at)}</p>

              <div class="section">
                <h2 class="section-title">Customer Information</h2>
                <table class="info-table">
                  <tbody>
                    <tr>
                      <td>Name:</td>
                      <td>${event.name}</td>
                    </tr>
                    <tr>
                      <td>Location:</td>
                      <td>${event.location}</td>
                    </tr>
                    <tr>
                      <td>Address:</td>
                      <td>${event.client_address}</td>
                    </tr>
                    <tr>
                      <td>Email:</td>
                      <td>${event.email}</td>
                    </tr>
                    <tr>
                      <td>Phone:</td>
                      <td>${event.phone}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              ${event.client_notes ? `
                <div class="notes-box">
                  <p><strong>Customer Notes:</strong> ${event.client_notes}</p>
                </div>
              ` : ''}

              <div class="section">
                <h2 class="section-title">Services Quoted</h2>
                <table class="services-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th class="qty-col">Qty</th>
                      <th class="price-col">Unit Price</th>
                      <th class="total-col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lineItems.map(item => `
                      <tr>
                        <td>${item.item}</td>
                        <td class="qty-col">${item.qty}</td>
                        <td class="price-col">${formatCurrency(item.item_price)}</td>
                        <td class="total-col">${formatCurrency(item.item_price * item.qty)}</td>
                      </tr>
                    `).join('')}
                    <tr class="total-row">
                      <td colspan="3" style="text-align: right;">Total Amount:</td>
                      <td class="total-col">${formatCurrency(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="notes-box">
                <p><strong>Next Steps:</strong> Review the services and pricing quoted above, then contact us to schedule your mold inspection. We'll arrive prepared with all necessary equipment and provide your detailed inspection report within 24-48 hours.</p>
              </div>

              <div class="button-container">
                <a href="#" class="accept-button">Accept Quote</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Fast Mold Testing, Inc. All rights reserved.</p>
              <p>
                <a href="https://fastmoldtesting.com/privacy">Privacy Policy</a>
                &nbsp;•&nbsp;
                <a href="https://fastmoldtesting.com/terms">Terms & Conditions</a>
              </p>
              <p style="font-size: 12px; color: #a0aec0;">This quote is valid for 30 days from the date generated.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}
