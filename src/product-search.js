import { algoliasearch } from "algoliasearch";
import OpenAI from "openai";
import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const algoliaClient = algoliasearch(process.env.ALGOLIA_APPLICATION_ID, process.env.ALGOLIA_API_KEY);
const openai = new OpenAI(); // uses process.env.OPENAI_API_KEY automatically
const app = express(); // starts our server
app.use(express.json()); 

let messages = [
  {
    role: "system",
    content: "You're a helpful customer service agent named Emma. You're now connected with a customer in a chat window on the website of AllTheGroceries, an ecommerce company that sells a wide variety of household grocery products. If you need information about the company that is generally available to a large group of customers or website visitors, the search_info function will let you search for that information. If you choose to use that information, recap it in your own words and in a human, conversational style, avoiding formatting. Before you give the user the answer, ask necessary followup questions to further narrow down the possible answers. Do not use Markdown - only use plain text."
  }
];

const toolFunctions = {
  "searchProducts": {
    definition: {
      type: "function",
      function: {
        name: "searchProducts",
        description: "Search for specific products in the product catalog.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The query string used to search through the product database"
            }
          },
          required: ["query"],
          additionalProperties: false
        }
      }
    },
    func: async ({ query }) => {
      // must return a string to be used as a message back to the AI

      const user = await authenticateUser();
      const { results } = await algoliaClient.search({
        requests: [
          {
            indexName: process.env.ALGOLIA_INDEX_NAME,
            query
          }
        ]
      });
      
      if (results[0].hits.length == 0) return "No entries were found.";

      const hits = results[0].hits.slice(0, 3);
      return {
        message: "Here is the JSON describing the top several results. These will be displayed below your message. Do not summarize the results or make a list. Pick one result to highlight or just introduce them all with a single sentence. Do not use Markdown; only use plain text.\n\n" + JSON.stringify(hits.map(hit => ({
          name: hit.name,
          bullets: hit.bullets,
          description: hit.description
        }))),
        displayOptions: hits.map(hit => ({
          name: hit.name,
          price: hit.price,
          rating: hit.rating,
          objectID: hit.objectID
        }))
      }
    }
  }
};

const authenticateUser = async () => {
  return {
    customerID: "e8f9g0h1-2i3j-4k5l-6m7n-8o9p0q1r2s3t",
    name: "Jaden",
    image: "https://placehold.co/60x60?text=J"
  };
}

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
      return {
        error: "The AI's response was too long."
      };

    case "content_filter":
      console.error("The AI's response violated their content policy.");
      return {
        error: "The AI's response violated their content policy."
      };

    case "tool_calls": // The AI is telling us to call a function
      // note that if you use the setting to force the ai to use a tool, the finish reason will actually be "stop", not "tool_calls". we're not using that functionality here so we don't need the extra logic.

      const requestedFunction = toolFunctions[response.choices[0].message.tool_calls[0].function.name]?.func;
      if (typeof requestedFunction === "undefined") {
        console.error("Somehow the AI tried to call a function that doesn't exist.");
        return {
          error: "Somehow the AI tried to call a function that doesn't exist."
        };
      }

      const toolCallResult = await requestedFunction(
        // the arguments the AI wants to pass to this function
        JSON.parse(response.choices[0].message.tool_calls[0].function.arguments)
      );

      messages.push({
        role: "tool",
        content: toolCallResult.message,
        tool_call_id: response.choices[0].message.tool_calls[0].id
      });

      return await getAIResponse(toolCallResult.displayOptions);

    case "stop": // The AI is just giving us a text response
      return {
        response: response.choices[0].message.content,
        displayOptions
      }
  }
};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pages/index.html');
});

app.use(express.static('public'))

app.post("/send-chat-message", async (req, res) => {
  const { content } = req.body;

  if (!content) {
    res.json({
      response: ""
    });
    return;
  }

  messages.push({
    role: "user",
    content
  });

  const output = await getAIResponse();
  res.json(output);
});

app.post("/get-user-image", async (req, res) => {
  const user = await authenticateUser();
  res.json({
    imageURL: user.image
  });
})

app.listen(3000);
