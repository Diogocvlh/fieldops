package com.fieldops.config;

import java.time.Clock;
import java.time.ZoneId;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ApplicationConfiguration {
    @Bean
    Clock applicationClock(@Value("${fieldops.time-zone}") String timeZone) {
        return Clock.system(ZoneId.of(timeZone));
    }

    @Bean
    WebMvcConfigurer corsConfiguration(@Value("${fieldops.cors-allowed-origins}") String origins) {
        String[] allowedOrigins = Arrays.stream(origins.split(","))
                .map(String::trim).filter(origin -> !origin.isEmpty()).toArray(String[]::new);
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/v1/**")
                        .allowedOrigins(allowedOrigins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("Content-Type", "Accept")
                        .maxAge(3600);
            }
        };
    }
}
