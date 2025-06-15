import 'dotenv/config';
import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateUser } from './auth.js';
import { buildAgentContext } from './handlers/buildAgentContext.js';
import { getAgentResponse } from './handlers/getAgentResponse.js';

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

  const { systemPrompt, tools } = buildAgentContext(user);

  let messages = userContexts.get(userId);
  if (!messages) {
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