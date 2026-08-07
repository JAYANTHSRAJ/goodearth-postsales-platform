package com.goodearth.postsales.notification.config;

import com.goodearth.postsales.notification.service.EmailService;
import com.goodearth.postsales.notification.service.Smtp2GoApiEmailService;
import com.goodearth.postsales.notification.service.SmtpEmailServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.util.StringUtils;

@Configuration
public class EmailConfiguration {

    private static final Logger log = LoggerFactory.getLogger(EmailConfiguration.class);

    @Bean
    @Primary
    public EmailService emailService(
            @Value("${SMTP2GO_API_KEY:}") String apiKey,
            @Value("${SMTP_FROM:${spring.mail.username:}}") String fromEmail,
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${spring.mail.port:}") String mailPort,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:}") String requireTls,
            @Value("${spring.mail.properties.mail.smtp.ssl.enable:}") String sslSecure,
            ObjectProvider<JavaMailSender> mailSenderProvider) {

        log.info("[EMAIL] SMTP2GO_API_KEY present={}", StringUtils.hasText(apiKey));

        EmailService impl;
        if (StringUtils.hasText(apiKey)) {
            impl = new Smtp2GoApiEmailService(apiKey, fromEmail);
        } else {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender != null) {
                impl = new SmtpEmailServiceImpl(mailSender, fromEmail, mailHost, mailPort, requireTls, sslSecure);
            } else {
                impl = (toEmail, subject, body) -> {
                    log.warn("[EMAIL] No-Op EmailService invoked. Email NOT sent to={}", toEmail);
                };
            }
        }

        log.info("[EMAIL] Using implementation={}", impl.getClass().getName());
        return impl;
    }
}
