export default {
  id: "searchOrders",
  name: "searchOrders",
  description: `Find past orders by ID, date, or status. Results are automatically filtered to the current user's orders. 
You can return between 1 and 6 results depending on how specific the query is.`,
  labelKey: "actions.orders",
  promptKey: "prompts.orders.default",
  tags: ["search", "orders", "account", "private", "authenticated"],
  visibility: {
    requiresUser: true
  },
  indexName: process.env.ALGOLIA_ORDERS_INDEX_NAME,
  needsUser: true,
  fieldsForMessage: ["orderNumber", "date", "total"],
  fieldsForOptions: {
    orderNumber: { label: "Order #", type: "id" },
    date: { label: "Order Date", type: "date" },
    total: { label: "Total", type: "currency" }
  },
  getSearchParams: ({ user }) => ({
    facetFilters: [`customerId:${user.customerID}`]
  }),
  formatIntro: () =>
    `Below this message, the user will see each order's number, total price, and date. Don't repeat the list — just highlight a relevant item or two in plain language.`
};