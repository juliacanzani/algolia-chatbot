import 'dotenv/config';
import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateUser } from './auth.js';
import { getString } from "./strings/index.js";
import { buildAgentContext } from './handlers/buildAgentContext.js';
import { getAgentResponse } from './handlers/getAgentResponse.js';
import { toolFunctions } from "./tools/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static('public'));

const userContexts = new Map();

const getUserKey = (req) =>
  req.query?.user ||
  req.body?.user ||
  req.headers?.["x-user-id"] ||
  process.env.DEFAULT_USER ||
  "jaden";

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pages/index.html');
});

app.post("/start-session", async (req, res) => {
  const userKey = getUserKey(req);
  const user = await authenticateUser(userKey);
  const userId = user.customerID;

  if (userContexts.has(userId)) {
    const message = getString(user.locale, "system.welcomeBack", { name: user.name });
  }

  const { systemPrompt, tools } = buildAgentContext(user);
  const welcome = await toolFunctions.getWelcomeMessage.func({}, user);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "assistant", content: welcome.message }
  ];

  userContexts.set(userId, messages);

  res.status(200).json({
    response: welcome.message,
    displayOptions: welcome.displayOptions,
    optionSchema: welcome.optionSchema,
    uiHints: welcome.uiHints
  });
});


app.post("/send-chat-message", async (req, res) => {
  const { content } = req.body;
  const userKey = getUserKey(req);
  const user = await authenticateUser(userKey);
  const userId = user.customerID;

  if (!content || content.trim().length < 2) {
    const msg = getString(user.locale, "system.minimumLengthRequirement");
    return res.json({ response: msg });
  }

  if (process.env.DEBUG_AUTH === "true") {
    console.log(`💬 Message from user: ${user.name} (${userId})`);
  }

  const { tools } = buildAgentContext(user);

  let messages = userContexts.get(userId);
  if (!messages) {
    console.warn(`⚠️ No session found for user ${userId}. Reinitializing with system prompt.`);
    const { systemPrompt } = buildAgentContext(user);
    messages = [{ role: "system", content: systemPrompt }];
    userContexts.set(userId, messages);
  }

  messages.push({ role: "user", content });

  const result = await getAgentResponse(messages, user, tools);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});