package com.knowflow;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class KnowflowAiApplicationTests {

	@Test
	void testByokClientCreation() {
		String testApiKey = "sk-proj-test1234567890123456789012345678901234567890";
		org.springframework.ai.openai.http.okhttp.SpringAiOpenAiHttpClient httpTransport =
				org.springframework.ai.openai.http.okhttp.SpringAiOpenAiHttpClient.builder().build();

		com.openai.core.ClientOptions clientOptions = com.openai.core.ClientOptions.builder()
				.httpClient(httpTransport)
				.apiKey(testApiKey)
				.baseUrl("https://api.openai.com/v1")
				.maxRetries(2)
				.build();

		com.openai.client.OpenAIClient openAiClient = new com.openai.client.OpenAIClientImpl(clientOptions);

		io.micrometer.observation.ObservationRegistry observationRegistry = io.micrometer.observation.ObservationRegistry.NOOP;

		org.springframework.ai.openai.OpenAiChatModel model = org.springframework.ai.openai.OpenAiChatModel.builder()
				.openAiClient(openAiClient)
				.observationRegistry(observationRegistry)
				.build();

		org.springframework.ai.chat.client.ChatClient client = org.springframework.ai.chat.client.ChatClient.builder(model).build();
		org.assertj.core.api.Assertions.assertThat(client).isNotNull();
	}

}
