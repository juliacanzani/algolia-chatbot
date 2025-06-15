import { toolFunctions } from "../tools/index.js";
import OpenAI from "openai";
import { trimMessageHistory } from "../utils/trimMessageHistory.js";

const openai = new OpenAI();

export async function getAgentResponse(messages, user, displayOptions = []) {
  const trimmedMessages = trimMessageHistory(messages, 30);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: trimmedMessages,
    tools: Object.values(toolFunctions).map(x => x.definition)
  });

  const assistantMessage = response.choices[0].message;

  switch (response.choices[0].finish_reason ?? "stop") {
    case "length":
      return { error: "The AI's response was too long." };

    case "content_filter":
      return { error: "The AI's response violated their content policy." };

    case "tool_calls": {
      messages.push(assistantMessage);

      let mergedDisplayOptions = [];
      let mergedOptionSchema = {};

      for (const toolCall of assistantMessage.tool_calls) {
        const tool = toolFunctions[toolCall.function.name];
        if (!tool || typeof tool.func !== "function") continue;

        const args = JSON.parse(toolCall.function.arguments);

        if (tool.needsUser && !user) {
          console.error(`❌ Tool "${toolCall.function.name}" needs user context but none was provided.`);
          continue;
        }

        const toolResult = tool.needsUser
          ? await tool.func(args, user)
          : await tool.func(args);

        const message = typeof toolResult === "string"
          ? toolResult
          : toolResult.message;

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: message
        });

        mergedDisplayOptions = toolResult.displayOptions || [];
        mergedOptionSchema = toolResult.optionSchema || {};
      }

      return await getAgentResponse(messages, user, mergedDisplayOptions);
    }

    case "stop":
    default:
      messages.push(assistantMessage);
      return {
        response: assistantMessage.content,
        displayOptions
      };
  }
}
