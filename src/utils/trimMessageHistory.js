export function trimMessageHistory(messages, max = 30) {
  const systemPrompt = messages.find(m => m.role === "system");
  const chatHistory = messages.filter(m => m.role !== "system");
  const trimmed = chatHistory.slice(-max);
  return systemPrompt ? [systemPrompt, ...trimmed] : trimmed;
}