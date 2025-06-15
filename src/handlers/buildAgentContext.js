import { getString } from "../strings/index.js";

export function buildAgentContext(user) {
  const locale = user?.locale || "en";

  const basePrompt = [
    getString(locale, "prompts.customerService.persona"),
    user.name
      ? getString(locale, "prompts.customerService.userWithName", { name: user.name })
      : getString(locale, "prompts.customerService.userGeneric"),
    getString(locale, "prompts.customerService.brand"),
    getString(locale, "prompts.customerService.constraints")
  ].join("\n\n");

  return {
    systemPrompt: basePrompt,
    tools: ["chooseNextAction", "searchOrders", "searchProducts", "searchAnnouncements"]
  };
}
