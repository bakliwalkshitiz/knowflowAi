package com.knowflow;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class KnowflowAiApplicationTests {

	@Test
	void testByokClientCreation() {
		String testApiKey = "sk-proj-test1234567890123456789012345678901234567890";
		com.openai.client.OpenAIClient openAiClient = org.springframework.ai.openai.setup.OpenAiSetup.setupSyncClient(
				null,
				testApiKey,
				null,
				null,
				null,
				"KnowFlowAI",
				false,
				true,
				"openai",
				null,
				2,
				null,
				java.util.Map.of(),
				null,
				null,
				java.util.List.of()
		);
		io.micrometer.observation.ObservationRegistry observationRegistry = io.micrometer.observation.ObservationRegistry.NOOP;
		org.springframework.ai.openai.OpenAiChatModel model = org.springframework.ai.openai.OpenAiChatModel.builder()
				.openAiClient(openAiClient)
				.observationRegistry(observationRegistry)
				.build();
		org.springframework.ai.chat.client.ChatClient client = org.springframework.ai.chat.client.ChatClient.builder(model).build();
		org.assertj.core.api.Assertions.assertThat(client).isNotNull();
	}

}
