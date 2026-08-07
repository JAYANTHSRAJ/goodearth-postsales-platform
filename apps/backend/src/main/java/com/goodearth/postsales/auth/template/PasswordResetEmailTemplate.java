package com.goodearth.postsales.auth.template;

public class PasswordResetEmailTemplate {

    public static String buildHtmlEmail(String userName, String resetUrl) {
        if (userName == null || userName.isBlank()) {
            userName = "Valued Homeowner";
        }

        return "<!DOCTYPE html>\n" +
               "<html lang=\"en\">\n" +
               "<head>\n" +
               "  <meta charset=\"UTF-8\">\n" +
               "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
               "  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n" +
               "  <title>Reset Your GoodEarth Password</title>\n" +
               "</head>\n" +
               "<body style=\"margin: 0; padding: 0; background-color: #F4F6F5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.6; color: #333333;\">\n" +
               "  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"background-color: #F4F6F5; padding: 40px 10px;\">\n" +
               "    <tr>\n" +
               "      <td align=\"center\">\n" +
               "        <!-- Main Container Card -->\n" +
               "        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E5E9E7; box-shadow: 0 4px 12px rgba(0,0,0,0.05);\">\n" +
               "          \n" +
               "          <!-- Header Banner with GoodEarth Brand Theme -->\n" +
               "          <tr>\n" +
               "            <td align=\"center\" style=\"background-color: #1F5E46; padding: 32px 20px; text-align: center;\">\n" +
               "              <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\">\n" +
               "                <tr>\n" +
               "                  <td align=\"center\">\n" +
               "                    <span style=\"font-family: 'Georgia', serif; font-size: 24px; font-weight: bold; color: #FFFFFF; letter-spacing: 2px; text-transform: uppercase;\">GOODEARTH</span>\n" +
               "                    <div style=\"font-size: 11px; color: #A3D2C0; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px;\">Homeowner Portal</div>\n" +
               "                  </td>\n" +
               "                </tr>\n" +
               "              </table>\n" +
               "            </td>\n" +
               "          </tr>\n" +
               "\n" +
               "          <!-- Content Body -->\n" +
               "          <tr>\n" +
               "            <td style=\"padding: 40px 32px; background-color: #FFFFFF;\">\n" +
               "              \n" +
               "              <h1 style=\"font-family: 'Georgia', serif; font-size: 22px; font-weight: 600; color: #1F5E46; margin: 0 0 20px 0; text-align: left;\">Reset Your GoodEarth Password</h1>\n" +
               "              \n" +
               "              <p style=\"font-size: 15px; color: #4A5568; margin: 0 0 16px 0;\">Hello " + userName + ",</p>\n" +
               "\n" +
               "              <p style=\"font-size: 14px; color: #4A5568; margin: 0 0 24px 0; line-height: 1.6;\">\n" +
               "                We received a request to reset the password for your GoodEarth Homeowner Portal account. Click the button below to set a new password.\n" +
               "              </p>\n" +
               "\n" +
               "              <!-- CTA Button Section -->\n" +
               "              <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin: 28px 0;\">\n" +
               "                <tr>\n" +
               "                  <td align=\"center\">\n" +
               "                    <!--[if mso]>\n" +
               "                    <v:roundrect xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:w=\"urn:schemas-microsoft-com:office:word\" href=\"" + resetUrl + "\" style=\"height:48px;v-text-anchor:middle;width:240px;\" arcsize=\"17%\" stroke=\"f\" fillcolor=\"#1F5E46\">\n" +
               "                      <w:anchorlock/>\n" +
               "                      <center style=\"color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;\">Reset My Password</center>\n" +
               "                    </v:roundrect>\n" +
               "                    <![endif]-->\n" +
               "                    <!--[if !mso]><!-->\n" +
               "                    <a href=\"" + resetUrl + "\" target=\"_blank\" style=\"background-color: #1F5E46; border-radius: 8px; color: #ffffff; display: inline-block; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: bold; line-height: 48px; text-align: center; text-decoration: none; width: 240px; -webkit-text-size-adjust: none; mso-hide: all; box-shadow: 0 2px 6px rgba(31,94,70,0.3);\">Reset My Password</a>\n" +
               "                    <!--<![endif]-->\n" +
               "                  </td>\n" +
               "                </tr>\n" +
               "              </table>\n" +
               "\n" +
               "              <!-- Security Notice Box -->\n" +
               "              <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 6px; margin: 24px 0;\">\n" +
               "                <tr>\n" +
               "                  <td style=\"padding: 14px 16px; font-size: 13px; color: #92400E; line-height: 1.5;\">\n" +
               "                    <strong>Security Notice:</strong> This password reset link expires in <strong>30 minutes</strong>.\n" +
               "                  </td>\n" +
               "                </tr>\n" +
               "              </table>\n" +
               "\n" +
               "              <p style=\"font-size: 13px; color: #718096; margin: 0 0 24px 0; line-height: 1.5;\">\n" +
               "                If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.\n" +
               "              </p>\n" +
               "\n" +
               "              <hr style=\"border: none; border-top: 1px solid #EDF2F7; margin: 24px 0;\" />\n" +
               "\n" +
               "              <!-- Fallback Link Section -->\n" +
               "              <p style=\"font-size: 12px; color: #718096; margin: 0 0 8px 0; line-height: 1.5;\">\n" +
               "                If the button doesn't work, copy and paste this link into your browser:\n" +
               "              </p>\n" +
               "              <p style=\"font-size: 12px; color: #1F5E46; margin: 0 0 24px 0; word-break: break-all; font-family: monospace;\">\n" +
               "                <a href=\"" + resetUrl + "\" style=\"color: #1F5E46; text-decoration: underline;\">" + resetUrl + "</a>\n" +
               "              </p>\n" +
               "\n" +
               "              <!-- Sign Off -->\n" +
               "              <p style=\"font-size: 14px; color: #4A5568; margin: 0;\">\n" +
               "                Regards,<br/>\n" +
               "                <strong style=\"color: #1F5E46;\">GoodEarth Team</strong>\n" +
               "              </p>\n" +
               "\n" +
               "            </td>\n" +
               "          </tr>\n" +
               "\n" +
               "          <!-- Footer Section -->\n" +
               "          <tr>\n" +
               "            <td style=\"background-color: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center;\">\n" +
               "              <p style=\"font-size: 12px; color: #64748B; margin: 0 0 8px 0;\">\n" +
               "                <a href=\"https://goodearth.org.in\" style=\"color: #1F5E46; text-decoration: none; font-weight: 500;\">Website</a> &bull; \n" +
               "                <a href=\"mailto:support@goodearth.org.in\" style=\"color: #1F5E46; text-decoration: none; font-weight: 500;\">support@goodearth.org.in</a>\n" +
               "              </p>\n" +
               "              <p style=\"font-size: 11px; color: #94A3B8; margin: 0;\">\n" +
               "                &copy; 2026 GoodEarth. All rights reserved.\n" +
               "              </p>\n" +
               "            </td>\n" +
               "          </tr>\n" +
               "\n" +
               "        </table>\n" +
               "      </td>\n" +
               "    </tr>\n" +
               "  </table>\n" +
               "</body>\n" +
               "</html>";
    }
}
