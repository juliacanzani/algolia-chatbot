import 'dotenv/config';
import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateUser } from './auth.js';
import { toolFunctions } from './tools/index.js';
import OpenAI from "openai";
import { promptTemplates } from './prompts/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const openai = new OpenAI(); // Uses process.env.OPENAI_API_KEY
const userContexts = new Map();

const getUserKey = (req) =>
  req.query?.user ||
  req.body?.user ||
  req.headers?.["x-user-id"] ||
  process.env.DEFAULT_USER ||
  "jaden";

const getAIResponse = async (messages, displayOptions = [], user) => {
  const trimmedMessages = trimMessageHistory(messages, 30);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: trimmedMessages,
    tools: Object.values(toolFunctions).map(x => x.definition)
  });

  const assistantMessage = response.choices[0].message;

  switch (response.choices[0].finish_reason ?? "stop") {
    case "length":
      console.error("The AI's response was too long.");
      return { error: "The AI's response was too long." };

    case "content_filter":
      console.error("The AI's response violated their content policy.");
      return { error: "The AI's response violated their content policy." };

    case "tool_calls": {
      messages.push(assistantMessage);

      const toolCalls = assistantMessage.tool_calls;
      let mergedDisplayOptions = [];
      let mergedOptionSchema = {};

      for (const toolCall of toolCalls) {
        const tool = toolFunctions[toolCall.function.name];
        if (!tool || typeof tool.func !== "function") continue;

        const args = JSON.parse(toolCall.function.arguments);

        if (tool.needsUser && !user) {
          console.error(`❌ Tool "${toolCall.function.name}" needs user context, but none was provided.`);
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

      const final = await getAIResponse(messages, [], user);

      return {
        ...final,
        displayOptions: mergedDisplayOptions,
        optionSchema: mergedOptionSchema
      };
    }

    case "stop":
      messages.push(assistantMessage);
      return {
        response: assistantMessage.content,
        displayOptions
      };
  }
};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pages/index.html');
});

app.use(express.static('public'));

app.post("/send-chat-message", async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim().length < 2) {
    return res.json({ response: "Can you give me a bit more detail?" });
  }

  const userKey = getUserKey(req);
  const user = await authenticateUser(userKey);
  const userId = user.customerID;

  if (process.env.DEBUG_AUTH === "true") {
    console.log(`💬 Message from user: ${user.name} (${userId})`);
  }

  let messages = userContexts.get(userId);
  if (!messages) {
    const systemPrompt = promptTemplates.customerService.build({ user });
    messages = [{ role: "system", content: systemPrompt }];
    userContexts.set(userId, messages);
  }

  messages.push({ role: "user", content });

  const result = await getAIResponse(messages, [], user);

  if (result.response) {
    messages.push({ role: "assistant", content: result.response });
  }

  res.json(result);
});

app.post("/get-user", async (req, res) => {
  const userKey = getUserKey(req);
  const user = await authenticateUser(userKey);

  res.json({
    name: user.name ?? null,
    locale: user.locale ?? "en",
    imageURL: user.image ?? "/user.webp"
  });
});

function trimMessageHistory(messages, max = 30) {
  const systemPrompt = messages.find(m => m.role === "system");
  const chatHistory = messages.filter(m => m.role !== "system");
  const trimmed = chatHistory.slice(-max);
  return systemPrompt ? [systemPrompt, ...trimmed] : trimmed;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});