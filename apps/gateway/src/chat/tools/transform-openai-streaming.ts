/**
 * Helper function to transform standard OpenAI streaming format
 */
export function transformOpenaiStreaming(data: any, usedModel: string): any {
	// Check if response has choices array (even without object field) - handle GLM/ZAI format
	// GLM returns: { id, choices: [{ delta: { reasoning_content } }] } without object field
	if (data.id && data.choices && Array.isArray(data.choices)) {
		// Has proper choices structure, transform it
		return {
			...data,
			object: "chat.completion.chunk", // Force correct object type for streaming
			choices:
				data.choices?.map((choice: any) => {
					if (!choice.delta) {
						return choice;
					}

					// Create new delta with role
					let delta: any = {
						...choice.delta,
						role: choice.delta.role || "assistant",
					};

					// Normalize reasoning_content field to reasoning for OpenAI compatibility
					if (delta.reasoning_content) {
						const { reasoning_content, ...rest } = delta;
						delta = {
							...rest,
							reasoning: reasoning_content,
						};
					}

					return {
						...choice,
						delta,
					};
				}) || data.choices,
		};
	}

	// Ensure the response has the required OpenAI format fields
	if (!data.id || !data.object) {
		let delta: any = data.delta
			? {
					...data.delta,
					role: data.delta.role || "assistant",
				}
			: {
					content: data.content || "",
					tool_calls: data.tool_calls || null,
					role: "assistant",
				};

		// Normalize reasoning_content field to reasoning for OpenAI compatibility
		if (delta.reasoning_content) {
			const { reasoning_content, ...rest } = delta;
			delta = {
				...rest,
				reasoning: reasoning_content,
			};
		}

		return {
			id: data.id || `chatcmpl-${Date.now()}`,
			object: "chat.completion.chunk",
			created: data.created || Math.floor(Date.now() / 1000),
			model: data.model || usedModel,
			choices: data.choices || [
				{
					index: 0,
					delta,
					finish_reason: data.finish_reason || null,
				},
			],
			usage: data.usage || null,
		};
	}

	// Fallback: response has both id and object but might be in unexpected format
	return data;
}
