import { describe, expect, test } from "vitest";

import { transformOpenaiStreaming } from "./transform-openai-streaming.js";

describe("transformOpenaiStreaming", () => {
	test("should transform reasoning_content to reasoning in GLM/ZAI streaming response", () => {
		const input = {
			id: "20251001083718482d179b80e643c6",
			object: "chat.completion.chunk",
			created: 1759279038,
			model: "glm-4.5v",
			choices: [
				{
					index: 0,
					delta: {
						role: "assistant",
						reasoning_content: "The",
					},
				},
			],
			usage: null,
		};

		const result = transformOpenaiStreaming(input, "glm-4.5v");

		// Verify the structure is preserved
		expect(result).toHaveProperty("id", "20251001083718482d179b80e643c6");
		expect(result).toHaveProperty("object", "chat.completion.chunk");
		expect(result).toHaveProperty("created", 1759279038);
		expect(result).toHaveProperty("model", "glm-4.5v");
		expect(result).toHaveProperty("choices");
		expect(result.choices).toHaveLength(1);

		// Verify reasoning_content was transformed to reasoning
		const delta = result.choices[0].delta;
		expect(delta).toHaveProperty("reasoning", "The");
		expect(delta).toHaveProperty("role", "assistant");
		expect(delta).not.toHaveProperty("reasoning_content");
	});

	test("should handle streaming response without reasoning_content", () => {
		const input = {
			id: "test-id",
			object: "chat.completion.chunk",
			created: 1234567890,
			model: "gpt-4",
			choices: [
				{
					index: 0,
					delta: {
						role: "assistant",
						content: "Hello",
					},
				},
			],
			usage: null,
		};

		const result = transformOpenaiStreaming(input, "gpt-4");

		// Verify normal content is preserved
		const delta = result.choices[0].delta;
		expect(delta).toHaveProperty("content", "Hello");
		expect(delta).toHaveProperty("role", "assistant");
		expect(delta).not.toHaveProperty("reasoning_content");
		expect(delta).not.toHaveProperty("reasoning");
	});

	test("should handle response without id/object fields", () => {
		const input = {
			delta: {
				reasoning_content: "Step 1",
			},
		};

		const result = transformOpenaiStreaming(input, "test-model");

		// Verify it creates proper structure
		expect(result).toHaveProperty("id");
		expect(result).toHaveProperty("object", "chat.completion.chunk");
		expect(result).toHaveProperty("choices");
		expect(result.choices[0].delta).toHaveProperty("reasoning", "Step 1");
		expect(result.choices[0].delta).not.toHaveProperty("reasoning_content");
	});

	test("should preserve role when transforming reasoning_content", () => {
		const input = {
			id: "test-id",
			object: "chat.completion.chunk",
			created: 1234567890,
			model: "glm-4.5",
			choices: [
				{
					index: 0,
					delta: {
						role: "assistant",
						reasoning_content: "Thinking...",
						content: "Answer",
					},
				},
			],
			usage: null,
		};

		const result = transformOpenaiStreaming(input, "glm-4.5");

		const delta = result.choices[0].delta;
		expect(delta).toHaveProperty("role", "assistant");
		expect(delta).toHaveProperty("reasoning", "Thinking...");
		expect(delta).toHaveProperty("content", "Answer");
		expect(delta).not.toHaveProperty("reasoning_content");
	});
});
