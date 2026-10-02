// Photographer/client-controlled fields (gallery title, client name, password,
// etc.) get interpolated into these HTML emails — escape them so a crafted
// value can't inject markup into a client's inbox.
function escapeHtml(value) {
  if (value === null || value === undefined) return value
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export const emailTemplates = {
  galleryShared: ({ clientName, galleryTitle, galleryUrl, password }) => {
    clientName = escapeHtml(clientName)
    galleryTitle = escapeHtml(galleryTitle)
    password = escapeHtml(password)
    return {
    subject: `${clientName ?  `${clientName}, y` : 'Y'}our photos are ready!  📸`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:  #F5F0EA; margin: 0; padding:  40px 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #7C3AED 0%, #F97316 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; font-size: 28px; margin: 0; font-weight: 600; }
            .content { padding: 40px 30px; }
            .content h2 { font-size: 24px; color: #1a1a1a; margin:  0 0 16px 0; }
            .content p { font-size: 16px; color: #666; line-height: 1.6; margin:  0 0 24px 0; }
            . button { display: inline-block; background: black; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 500; margin:  8px 0; }
            .password-box { background: #F5F0EA; border: 2px solid #e0d5c7; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center; }
            .password-box . label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .password-box . password { font-size: 24px; font-weight: 700; color: #1a1a1a; font-family: monospace; letter-spacing: 2px; }
            .footer { padding: 30px; text-align: center; color: #999; font-size: 14px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📸 Artydrop</h1>
            </div>
            <div class="content">
              <h2>Your photos are ready!</h2>
              <p>Your photographer has shared <strong>${galleryTitle}</strong> with you.</p>
              <p>Click the button below to view and download your photos. </p>
              
              ${password ? `
                <div class="password-box">
                  <div class="label">Gallery Password</div>
                  <div class="password">${password}</div>
                </div>
                <p style="font-size: 14px; color: #999;">You'll need this password to access your gallery.</p>
              ` : ''}
              
              <div style="text-align: center; margin:  32px 0;">
                <a href="${galleryUrl}" class="button">View My Photos</a>
              </div>
              
              <p style="font-size: 14px; color: #999;">
                Need help? Reply to this email or contact us at <a href="mailto:support@artydrop.studio" style="color: #7C3AED;">support@artydrop.studio</a>.
              </p>
            </div>
            <div class="footer">
              <p>Sent by Artydrop • Calm, intentional photo delivery</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" style="color: #999;">Terms</a> • <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #999;">Privacy</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }},

  expirationWarning: ({ clientName, galleryTitle, galleryUrl, daysLeft }) => {
    clientName = escapeHtml(clientName)
    galleryTitle = escapeHtml(galleryTitle)
    return {
    subject: `⏰ Your gallery "${galleryTitle}" expires in ${daysLeft} days`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; background: #F5F0EA; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius:  16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #d97706; font-size: 24px; margin: 0 0 16px 0;">⏰ Expiration Notice</h2>
            <p style="font-size: 16px; color: #666; line-height:  1.6;">
              Hi ${clientName || 'there'},
            </p>
            <p style="font-size: 16px; color: #666; line-height: 1.6;">
              Your gallery <strong>${galleryTitle}</strong> will expire in <strong>${daysLeft} days</strong>. 
            </p>
            <p style="font-size: 16px; color: #666; line-height: 1.6;">
              Make sure to download any photos you want to keep before it's gone! 
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${galleryUrl}" style="display: inline-block; background: #d97706; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 500;">Download My Photos</a>
            </div>
          </div>
        </body>
      </html>
    `
  }},

  tipReceived: ({ photographerName, amount, galleryTitle, buyerEmail, dashboardUrl }) => {
    photographerName = escapeHtml(photographerName)
    galleryTitle = escapeHtml(galleryTitle)
    buyerEmail = escapeHtml(buyerEmail)
    return {
    subject: `You just got tipped €${amount} 💶`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F5F0EA; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="padding: 40px 30px 24px;">
              <h2 style="font-size: 24px; color: #1a1a1a; margin: 0 0 16px 0;">Someone loved your work 💶</h2>
              <p style="font-size: 16px; color: #666; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${photographerName || 'there'}, a client just left you a tip${galleryTitle ? ` on <strong>${galleryTitle}</strong>` : ''}.
              </p>

              <div style="background: #F5F0EA; border-radius: 12px; padding: 24px; margin: 0 0 24px 0; text-align: center;">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Tip amount</div>
                <div style="font-size: 32px; font-weight: 700; color: #1a1a1a;">€${amount}</div>
              </div>

              <p style="font-size: 14px; color: #999; line-height: 1.6; margin: 0 0 24px 0;">
                100% of this goes straight to your connected bank account. ArtyDrop doesn't take a cut on tips.
                ${buyerEmail ? `Sent by ${buyerEmail}.` : ''}
              </p>

              <div style="text-align: center; margin: 8px 0 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background: black; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 500;">View Dashboard</a>
              </div>
            </div>
            <div style="padding: 24px 30px; text-align: center; color: #999; font-size: 13px; border-top: 1px solid #eee;">
              Sent by ArtyDrop
            </div>
          </div>
        </body>
      </html>
    `
  }},

  photoPurchaseConfirmation: ({ galleryTitle, photoCount, amount, successUrl }) => {
    galleryTitle = escapeHtml(galleryTitle)
    return {
    subject: `Your ${photoCount} photo${photoCount > 1 ? 's are' : ' is'} ready to download 📸`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F5F0EA; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="padding: 40px 30px 24px;">
              <h2 style="font-size: 24px; color: #1a1a1a; margin: 0 0 16px 0;">Thanks for your purchase!</h2>
              <p style="font-size: 16px; color: #666; line-height: 1.6; margin: 0 0 24px 0;">
                Your ${photoCount} photo${photoCount > 1 ? 's' : ''} from <strong>${galleryTitle || 'the gallery'}</strong> ${photoCount > 1 ? 'are' : 'is'} ready, full resolution, no watermark.
              </p>

              <div style="background: #F5F0EA; border-radius: 12px; padding: 24px; margin: 0 0 24px 0; text-align: center;">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Total paid</div>
                <div style="font-size: 32px; font-weight: 700; color: #1a1a1a;">€${amount}</div>
              </div>

              <div style="text-align: center; margin: 8px 0 0;">
                <a href="${successUrl}" style="display: inline-block; background: black; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 500;">Download My Photos</a>
              </div>

              <p style="font-size: 13px; color: #999; line-height: 1.6; margin: 24px 0 0; text-align: center;">
                Keep this email. This link works any time you want to re-download.
              </p>
            </div>
            <div style="padding: 24px 30px; text-align: center; color: #999; font-size: 13px; border-top: 1px solid #eee;">
              Sent by ArtyDrop
            </div>
          </div>
        </body>
      </html>
    `
  }},

  receiptEmail: ({ customerName, amount, planName, invoiceUrl }) => {
    customerName = escapeHtml(customerName)
    planName = escapeHtml(planName)
    return {
    subject: `Receipt for your Artydrop ${planName} purchase`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; background: #F5F0EA; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background:  white; border-radius: 16px; padding: 40px;">
            <h2 style="font-size: 24px; color: #1a1a1a; margin:  0 0 24px 0;">Payment Received ✓</h2>
            <p style="font-size: 16px; color: #666;">Hi ${customerName},</p>
            <p style="font-size: 16px; color: #666;">Thank you for your purchase! </p>
            
            <div style="background: #F5F0EA; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">Plan</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 16px;">${planName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size:  14px;">Amount</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size:  16px;">€${amount}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${invoiceUrl}" style="display: inline-block; background: black; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight:  500;">View Invoice</a>
            </div>
            
            <p style="font-size: 14px; color: #999; text-align: center; margin-top: 32px;">
              Questions? Contact us at support@artydrop.studio
            </p>
          </div>
        </body>
      </html>
    `
  }}
}