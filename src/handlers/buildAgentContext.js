import { customerServicePrompt } from "../prompts/customerService.js";

export function buildAgentContext(user) {
  const locale = user?.locale || "en";
  const prompts = customerServicePrompt[locale] || customerServicePrompt.en;

  const role = user?.role || "default";

  const basePrompt = [
    prompts.persona,
    user.name ? prompts.userWithName.replace("{name}", user.name) : prompts.userGeneric,
    prompts.brand,
    prompts.constraints
  ].join("\n\n");

  return {
    systemPrompt: basePrompt,
    tools: ["searchOrders", "searchProducts", "searchAnnouncements"]
  };
}
