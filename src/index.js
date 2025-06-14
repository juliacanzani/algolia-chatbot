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
let messages = [
  {
    role: "system",
    content: "You're a helpful customer service agent named Penny. You're now connected with a customer in a chat window on the website of AllTheThings, an ecommerce company that sells a wide variety of household products. If you need information about the company that is generally available to a large group of customers or website visitors, the search_info function will let you search for that information. If you choose to use that information, recap it in your own words and in a human, conversational style, avoiding formatting. Before you give the user the answer, ask necessary followup questions to further narrow down the possible answers."
  }
];

const getAIResponse = async (displayOptions = []) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    tools: Object.values(toolFunctions).map(x => x.definition)
  });

  messages.push(response.choices[0].message);

  switch (response.choices[0].finish_reason ?? "stop") {
    case "length":
      console.error("The AI's response was too long.");
      return { error: "The AI's response was too long." };

    case "content_filter":
      console.error("The AI's response violated their content policy.");
      return { error: "The AI's response violated their content policy." };

    case "tool_calls": {
      const toolCalls = response.choices[0].message.tool_calls;

      let mergedDisplayOptions = [];
      let mergedOptionSchema = {};

      for (const toolCall of toolCalls) {
        const func = toolFunctions[toolCall.function.name]?.func;
        if (!func) continue;

        const args = JSON.parse(toolCall.function.arguments);
        const result = await func(args);

        const message = typeof result === "string" ? result : result.message;
        const displayOptions = result.displayOptions || [];
        const optionSchema = result.optionSchema || {};

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: typeof result === "string" ? result : result.message
        });

        mergedDisplayOptions = displayOptions;
        mergedOptionSchema = optionSchema;
      }

      const final = await getAIResponse();

      return {
        ...final,
        displayOptions: mergedDisplayOptions,
        optionSchema: mergedOptionSchema
      };
     
    }


    case "stop":
      return {
        response: response.choices[0].message.content,
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
    return res.json({
      response: "Can you give me a bit more detail?"
    });
  }

  messages.push({ role: "user", content });

  const output = await getAIResponse();
  res.json(output); // includes response + displayOptions
});


app.post("/get-user-image", async (req, res) => {
  const user = await authenticateUser();
  res.json({
    imageURL: user.image
  });
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});