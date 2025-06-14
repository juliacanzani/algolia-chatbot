import 'dotenv/config';
import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateUser } from './auth.js';
import { toolFunctions } from './tools/index.js';
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express(); // starts our server
app.use(express.json()); 

const openai = new OpenAI(); // uses process.env.OPENAI_API_KEY automatically
const userContexts = new Map();

const getAIResponse = async (messages, displayOptions = []) => {
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
        const func = toolFunctions[toolCall.function.name]?.func;
        if (!func) continue;

        const args = JSON.parse(toolCall.function.arguments);
        const result = await func(args);

        const message = typeof result === "string" ? result : result.message;

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: message
        });

        mergedDisplayOptions = result.displayOptions || [];
        mergedOptionSchema = result.optionSchema || {};
      }

      const final = await getAIResponse(messages);

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

app.use(express.static('public'))

app.post("/send-chat-message", async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim().length < 2) {
    return res.json({ response: "Can you give me a bit more detail?" });
  }

  const user = await authenticateUser(req);
  const userId = user.customerID;
  
  if(process.env.DEBUG_AUTH === "true") {
    console.log(`💬 Message from user: ${user.name} (${userId})`);
  }

  let messages = userContexts.get(userId);
  if (!messages) {
    messages = [
      {
        role: "system",
        content: `You're a helpful customer service agent named Penny. 
                  You're now chatting with ${user.name} (please greet the user by this name, when it's available) on the website of AllTheThings, an ecommerce grocery site with a huge product inventory and infrastructure, similar to Whole Foods.
                  The AllTheThings chat client does not support Markdown, HTML, or any other formatting. Respond using plain text only. Do not include asterisks, underscores, bullet points, code blocks, tables, or links — even if the user asks for them. Just write clearly in natural language.`
      }
    ];
    userContexts.set(userId, messages);
  }

  messages.push({ role: "user", content });

  const result = await getAIResponse(messages);

  if (result.response) {
    messages.push({ role: "assistant", content: result.response });
  }

  res.json(result);
});

app.post("/get-user-image", async (req, res) => {
  const user = await authenticateUser(req);
  res.json({
    imageURL: user.image
  });
})

function trimMessageHistory(messages, max = 30) {
  const systemPrompt = messages.find(m => m.role === "system");
  const chatHistory = messages.filter(m => m.role !== "system");

  const trimmed = chatHistory.slice(-max); // keep last N non-system messages
  return systemPrompt ? [systemPrompt, ...trimmed] : trimmed;
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});