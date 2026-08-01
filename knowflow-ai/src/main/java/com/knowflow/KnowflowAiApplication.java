package com.knowflow;

import com.knowflow.config.RagProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@EnableConfigurationProperties(RagProperties.class)
@SpringBootApplication
public class KnowflowAiApplication {

	public static void main(String[] args) {
		SpringApplication.run(KnowflowAiApplication.class, args);
	}

}
