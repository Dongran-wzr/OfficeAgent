package com.officeagent.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map /audio/** to local static/audio/ directory
        // Use user.dir to get the current working directory, then point to static/audio/
        String projectRoot = System.getProperty("user.dir");
        String staticAudioPath = "file:" + projectRoot + File.separator + "static" + File.separator + "audio" + File.separator;
        
        System.out.println("Configuring static audio path: " + staticAudioPath);
        
        registry.addResourceHandler("/audio/**")
                .addResourceLocations(staticAudioPath);
    }
}
