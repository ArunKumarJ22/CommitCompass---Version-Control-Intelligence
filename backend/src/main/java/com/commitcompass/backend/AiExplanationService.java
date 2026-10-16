
package com.commitcompass.backend;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.ChatModel;
import com.openai.models.responses.Response;
import com.openai.models.responses.ResponseCreateParams;

import org.springframework.stereotype.Service;

@Service
public class AiExplanationService {

    private final OpenAIClient client;

    public AiExplanationService() {
        this.client = OpenAIOkHttpClient.fromEnv();
    }

    public String explainDiff(String diff) {
        if (diff == null || diff.isBlank()) {
            throw new IllegalArgumentException(
                "A code diff is required."
            );
        }

        if (diff.length() > 30000) {
            throw new IllegalArgumentException(
                "The diff is too large. Please provide a smaller diff."
            );
        }

        String prompt = """
            You are a senior software engineer reviewing a Git commit.

            Explain the supplied code diff using these sections:

            1. What changed?
            2. Why does it matter?
            3. Potential risks or bugs
            4. Suggested tests

            Base your explanation only on the supplied diff.
            Do not invent requirements, behavior, or context.
            If something cannot be determined from the diff,
            explicitly say so.

            Code diff:
            """ + diff;

        ResponseCreateParams params = ResponseCreateParams.builder()
            .model(ChatModel.GPT_4O)
            .input(prompt)
            .build();

        Response response = client.responses().create(params);

        return response.output().stream()
            .flatMap(item -> item.message().stream())
            .flatMap(message -> message.content().stream())
            .flatMap(content -> content.outputText().stream())
            .map(outputText -> outputText.text())
            .reduce("", String::concat);
    }
}
