package com.goodearth.postsales.notification.config;

import com.goodearth.postsales.notification.service.EmailService;
import com.goodearth.postsales.notification.service.Smtp2GoApiEmailService;
import com.goodearth.postsales.notification.service.SmtpEmailServiceImpl;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.util.StringUtils;

@Configuration
public class EmailConfiguration {

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

        if (StringUtils.hasText(apiKey)) {
            return new Smtp2GoApiEmailService(apiKey, fromEmail);
        } else {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            return new SmtpEmailServiceImpl(mailSender, fromEmail, mailHost, mailPort, requireTls, sslSecure);
        }
    }
}
