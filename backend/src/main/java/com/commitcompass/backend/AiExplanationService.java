
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

    
public String analyzeRisk(String diff) {
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
        You are a senior software engineer performing risk analysis
        on a Git commit.

        Analyze only the supplied code diff.

        Structure your response using these sections:

        1. Overall Risk Level
           Choose Low, Medium, or High.
           Explain the evidence behind your assessment.

        2. Potential Bugs
           Identify specific potential bugs supported by the diff.
           If no concrete bug is evident, say so.

        3. Regression Risks
           Explain how existing behavior could be affected.
           Distinguish observed changes from possibilities.

        4. Recommended Tests
           Recommend specific tests for the changed behavior.
           Include relevant unit tests, integration tests, and regression
           tests where appropriate.
           Explain what each test should verify.
           Base recommendations on the supplied diff, and identify
           assumptions when context is missing.

        5. Recommended Actions
           List practical steps a developer should take.

        Important rules:
        - Do not invent missing code or requirements.
        - Do not claim that a bug definitely exists without evidence.
        - Mention uncertainty when the diff lacks context.
        - Do not treat every code removal as a risk.
        - Return normal Markdown without escaping its formatting
          characters with backslashes.

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
