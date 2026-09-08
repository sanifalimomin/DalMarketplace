// Inline-styled HTML email templates. Email clients don't support external CSS,
// flexbox, or grid reliably, so layout uses nested tables and every rule is inline —
// this mirrors the app's look (black "DM" mark, Inter font, dark button) as closely
// as email rendering allows.

function emailShell({ heading, bodyHtml }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f2f2f2;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f2f2;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:20px;border:1px solid #e2e2e2;">
            <tr>
              <td style="padding:32px 32px 0 32px;text-align:center;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="width:30px;height:30px;background-color:#1a1a1a;border-radius:8px;text-align:center;vertical-align:middle;">
                      <span style="font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:13px;color:#ffffff;">DM</span>
                    </td>
                    <td style="padding-left:10px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#1a1a1a;">
                      DalMarketplace
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px 32px;text-align:center;">
                <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#1a1a1a;">${heading}</h1>
              </td>
            </tr>
            ${bodyHtml}
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #e2e2e2;text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a6a6a6;">
                  DalMarketplace &middot; a marketplace for Dalhousie students
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function verificationEmailTemplate(link) {
  const html = emailShell({
    heading: "Verify your email",
    bodyHtml: `
            <tr>
              <td style="padding:0 32px 24px 32px;text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#4d4d4d;">
                  Confirm this is your Dalhousie email address to finish setting up your DalMarketplace account.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 20px 32px;text-align:center;">
                <a href="${link}" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;">
                  Verify email address
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a6a6a6;word-break:break-all;">
                  Or paste this link into your browser:<br />
                  <a href="${link}" style="color:#4d4d4d;">${link}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#808080;">
                  This link expires in 1 hour. If you didn&rsquo;t create a DalMarketplace account, you can ignore this email.
                </p>
              </td>
            </tr>`,
  });

  const text = `Verify your DalMarketplace email\n\nPaste this link into your browser to verify your account (expires in 1 hour):\n${link}\n\nIf you didn't create a DalMarketplace account, you can ignore this email.`;

  return { html, text };
}

function passwordResetEmailTemplate(link) {
  const html = emailShell({
    heading:"Reset your password",
    bodyHtml: `
            <tr>
              <td style="padding:0 32px 24px 32px;text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#4d4d4d;">
                  Reset your password for Dalmarketplace.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 20px 32px;text-align:center;">
                <a href="${link}" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;">
                  Reset password
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a6a6a6;word-break:break-all;">
                  Or paste this link into your browser:<br />
                  <a href="${link}" style="color:#4d4d4d;">${link}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#808080;">
                  This link expires in 1 hour. If you didnt attempt to change your password, you can ignore this email.
                </p>
              </td>
            </tr>`,
  });

  const text = `Reset your password for DalMarketplace\n\nPaste this link into your browser to reset your password (expires in 1 hour):\n${link}\n\nIf you didn't attempt to reset your password, you can ignore this email.`;

  return { html, text};
}

module.exports = { verificationEmailTemplate, passwordResetEmailTemplate };
