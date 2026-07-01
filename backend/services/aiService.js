const Product = require('../models/Product');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Fetch all products from MongoDB and format them for the AI context.
 * Returns a concise string representation of the catalog.
 */
const getProductsContext = async () => {
  const products = await Product.find({})
    .select('name description price category stock imageUrl ratings numReviews discountPercentage discountPrice')
    .lean();

  if (!products.length) return 'No products currently available in the catalog.';

  return products.map((p, i) =>
    `[${i + 1}] ${p.name} | Category: ${p.category} | Price: ₹${p.price}${p.discountPercentage > 0 ? ` (${p.discountPercentage}% off, now ₹${p.discountPrice})` : ''} | Rating: ${p.ratings?.toFixed(1) || '0.0'} (${p.numReviews || 0} reviews) | In Stock: ${p.stock > 0 ? 'Yes' : 'No'} | ID: ${p._id}`
  ).join('\n');
};

/**
 * Build the system prompt that instructs Gemini how to behave as a ShopNest assistant.
 */
const buildSystemPrompt = (productsContext) => `You are ShopNest AI — a friendly, expert shopping assistant for the ShopNest e-commerce store.

## Your Role
Help users discover and choose products from the ShopNest catalog. Be conversational, helpful, and concise.

## ShopNest Product Catalog
Below is the FULL list of products currently available. You MUST only recommend products from this list. Never invent or hallucinate products.

${productsContext}

## Response Rules
1. ONLY recommend products that exist in the catalog above. Reference them by name and ID.
2. When recommending products, format your response as a JSON array of product IDs wrapped in a markdown code block like this:
   \`\`\`product_ids
   ["productId1", "productId2"]
   \`\`\`
   Place this block at the END of your response.
3. Keep your conversational text brief (2-4 sentences max) before the product IDs.
4. If no products match, say so politely and suggest the closest alternatives from the catalog.
5. You can filter by: category, price range, rating, name keywords, stock availability.
6. For price queries like "under ₹3000", filter products where price <= 3000.
7. For "best rated", sort by rating descending.
8. For "trending" or "popular", sort by numReviews descending.
9. For category queries, match the category field (case-insensitive).
10. Be warm and professional. Use emojis sparingly.

## Example
User: "Show me electronics under 5000"
You: "Here are some great electronics options under ₹5000! 🎧"
Then append:
\`\`\`product_ids
["id1", "id2", "id3"]
\`\`\``;

/**
 * Call the Gemini API and return the text response.
 */
const callGemini = async (systemPrompt, userMessage) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I am ShopNest AI, ready to help users find products from the catalog.' }] },
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('[Gemini API] Error response:', response.status, errBody);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

/**
 * Parse product IDs from the AI response text.
 * Looks for a ```product_ids code block containing a JSON array.
 */
const parseProductIds = (text) => {
  const match = text.match(/```product_ids\s*\n(\[[\s\S]*?\])\s*\n```/);
  if (!match) return [];
  try {
    const ids = JSON.parse(match[1]);
    return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

/**
 * Main function: takes user message, fetches catalog, calls Gemini, returns response + products.
 */
const getAIResponse = async (userMessage) => {
  // 1. Fetch products from MongoDB
  const productsContext = await getProductsContext();

  // 2. Build system prompt with catalog
  const systemPrompt = buildSystemPrompt(productsContext);

  // 3. Call Gemini
  const rawResponse = await callGemini(systemPrompt, userMessage);

  // 4. Extract product IDs from response
  const productIds = parseProductIds(rawResponse);

  // 5. Clean response text (remove the code block from displayed text)
  const cleanResponse = rawResponse.replace(/```product_ids\s*\n[\s\S]*?\n```/, '').trim();

  // 6. Fetch full product objects for the matched IDs
  let products = [];
  if (productIds.length > 0) {
    products = await Product.find({ _id: { $in: productIds } })
      .select('name description price category stock imageUrl ratings numReviews discountPercentage discountPrice')
      .lean();
  }

  return {
    reply: cleanResponse || 'Here are some products you might like!',
    products
  };
};

module.exports = { getAIResponse };
