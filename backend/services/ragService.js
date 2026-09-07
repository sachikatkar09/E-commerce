const Product = require("../models/Product");
const { generateEmbedding } = require("./embeddingService");
const { get_namespace } = require("../config/pinecone");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const LLM_MODEL = process.env.GEMINI_LLM_MODEL || "gemini-2.0-flash";

const GREETING_PATTERNS =
  /^(hi|hello|hey|howdy|good morning|good evening|good afternoon|what's up|sup|yo|hola|namaste|how are you|how's it going|greetings)\b[!?.\s]*$/i;

const isGreeting = (query) => GREETING_PATTERNS.test(query.trim());

const KNOWN_CATEGORIES = [
  "electronics", "fashion", "furniture", "clothing", "books",
  "beauty", "toys", "sports", "grocery", "home", "accessories",
  "shoes", "shoe", "footwear",
];

const COLOR_WORDS = [
  "black", "white", "red", "blue", "green", "pink", "yellow",
  "orange", "purple", "brown", "grey", "gray", "silver", "gold",
  "navy", "beige", "cream", "teal", "maroon", "olive", "coral",
  "lavender", "mint", "peach", "ivory", "charcoal", "tan", "cyan",
];

const parseQuery = (rawQuery) => {
  const lower = rawQuery.toLowerCase().trim();
  const result = {
    category: null,
    colors: [],
    maxPrice: null,
    keywords: [],
    isProductQuery: false,
  };

  for (const cat of KNOWN_CATEGORIES) {
    if (lower.includes(cat)) {
      result.category = cat === "shoe" || cat === "shoes" ? "clothing" : cat;
      result.isProductQuery = true;
      break;
    }
  }

  for (const color of COLOR_WORDS) {
    if (lower.includes(color)) {
      result.colors.push(color);
      result.isProductQuery = true;
    }
  }

  const pricePatterns = [
    /under\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i,
    /below\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i,
    /less\s*than\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i,
    /max(?:imum)?\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i,
    /budget\s*(?:of\s*)?(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i,
    /(\d[\d,]*)\s*(?:or\s*)?less/i,
  ];
  for (const pattern of pricePatterns) {
    const match = lower.match(pattern);
    if (match) {
      result.maxPrice = parseInt(match[1].replace(/,/g, ""));
      result.isProductQuery = true;
      break;
    }
  }

  const stopWords = new Set([
    "show", "me", "the", "a", "an", "some", "any", "i", "want",
    "to", "buy", "find", "get", "need", "looking", "for", "of",
    "with", "and", "or", "in", "on", "at", "do", "you", "have",
    "has", "does", "is", "are", "was", "were", "it", "this",
    "that", "these", "those", "can", "could", "would", "should",
    "will", "my", "your", "his", "her", "its", "our", "their",
    "what", "which", "who", "how", "where", "when", "why",
    "all", "every", "each", "both", "few", "more", "most",
    "other", "into", "over", "only", "also", "then", "than",
    "too", "very", "just", "about", "from", "there", "here",
    "now", "new", "old", "best", "cheap", "expensive", "good",
    "great", "really", "please", "recommend", "suggestion",
    "available", "stock", "ones", "one", "product", "products",
    "item", "items", "stuff", "things", "give", "tell", "list",
  ]);

  const words = lower
    .replace(/[?!.,;:'"()₹$]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  const categoryAliases = {
    laptop: "electronics", laptops: "electronics",
    computer: "electronics", computers: "electronics", pc: "electronics",
    headphone: "electronics", headphones: "electronics",
    earphone: "electronics", earphones: "electronics", earbuds: "electronics",
    camera: "electronics", cameras: "electronics",
    phone: "electronics", phones: "electronics", smartphone: "electronics",
    tablet: "electronics", tablets: "electronics",
    speaker: "electronics", speakers: "electronics",
    tv: "electronics", television: "electronics",
    watch: "accessories", watches: "accessories",
    dress: "clothing", dresses: "clothing",
    shirt: "clothing", shirts: "clothing",
    pants: "clothing", jeans: "clothing",
    jacket: "clothing", jackets: "clothing",
    skirt: "clothing", tops: "clothing",
    tshirt: "clothing", "t-shirts": "clothing",
    shoe: "clothing", shoes: "clothing", sneakers: "clothing",
    sandal: "clothing", sandals: "clothing",
    boot: "clothing", boots: "clothing", heels: "clothing",
    chair: "furniture", chairs: "furniture",
    table: "furniture", tables: "furniture",
    sofa: "furniture", sofas: "furniture",
    desk: "furniture", beds: "furniture", bed: "furniture",
    bookshelf: "furniture",
  };

  for (const word of words) {
    if (categoryAliases[word] && !result.category) {
      result.category = categoryAliases[word];
      result.isProductQuery = true;
    } else if (!COLOR_WORDS.includes(word)) {
      result.keywords.push(word);
    }
  }

  if (
    lower.includes("price") || lower.includes("cost") ||
    lower.includes("₹") || lower.includes("rs") || lower.includes("rupee")
  ) {
    result.isProductQuery = true;
  }

  if (
    lower.includes("available") || lower.includes("stock") ||
    lower.includes("in stock") || lower.includes("out of stock")
  ) {
    result.isProductQuery = true;
  }

  return result;
};

const searchByProductName = async (query) => {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  try {
    const exactMatch = await Product.findOne({
      name: { $regex: `^${escaped}$`, $options: "i" },
    });
    if (exactMatch) {
      console.log("[RAG] Exact name match:", exactMatch.name);
      return [exactMatch];
    }
  } catch (e) {
    console.error("[RAG] Exact name search error:", e.message);
  }

  try {
    const partialMatches = await Product.find({
      name: { $regex: escaped, $options: "i" },
    }).limit(5);
    if (partialMatches.length > 0) {
      console.log("[RAG] Partial name matches:", partialMatches.map((p) => p.name));
      return partialMatches;
    }
  } catch (e) {
    console.error("[RAG] Partial name search error:", e.message);
  }

  try {
    const queryWords = query
      .toLowerCase()
      .replace(/[?!.,;:'"()₹$]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (queryWords.length > 0) {
      const allProducts = await Product.find({});
      const scored = allProducts.map((product) => {
        const nameLower = product.name.toLowerCase();
        const descLower = (product.description || "").toLowerCase();
        const combined = `${nameLower} ${descLower}`;
        const matchCount = queryWords.filter((w) => combined.includes(w)).length;
        const nameMatchCount = queryWords.filter((w) => nameLower.includes(w)).length;
        return { product, matchCount, nameMatchCount };
      });

      scored.sort((a, b) => {
        if (b.nameMatchCount !== a.nameMatchCount) return b.nameMatchCount - a.nameMatchCount;
        return b.matchCount - a.matchCount;
      });

      const minRequired = Math.max(1, Math.ceil(queryWords.length * 0.5));
      const relevant = scored.filter(
        (s) => s.matchCount >= minRequired,
      );

      if (relevant.length > 0) {
        console.log(
          "[RAG] Word-overlap matches:",
          relevant.map((r) => `${r.product.name} (score: ${r.matchCount}/${queryWords.length})`),
        );
        return relevant.map((r) => r.product);
      }
    }
  } catch (e) {
    console.error("[RAG] Word-overlap search error:", e.message);
  }

  return [];
};

const buildMongoFilter = (parsed) => {
  const filter = {};

  if (parsed.category) {
    filter.category = new RegExp(`^${parsed.category}$`, "i");
  }

  if (parsed.maxPrice) {
    filter.price = { $lte: parsed.maxPrice };
  }

  if (parsed.colors.length > 0) {
    const colorPattern = parsed.colors.join("|");
    filter.$or = [
      { name: { $regex: colorPattern, $options: "i" } },
      { description: { $regex: colorPattern, $options: "i" } },
    ];
  }

  if (parsed.keywords.length > 0) {
    const keywordRegex = parsed.keywords.join("|");
    if (filter.$or) {
      const colorOr = filter.$or;
      delete filter.$or;
      filter.$and = [
        { $or: colorOr },
        {
          $or: [
            { name: { $regex: keywordRegex, $options: "i" } },
            { description: { $regex: keywordRegex, $options: "i" } },
          ],
        },
      ];
    } else {
      filter.$or = [
        { name: { $regex: keywordRegex, $options: "i" } },
        { description: { $regex: keywordRegex, $options: "i" } },
      ];
    }
  }

  return filter;
};

const searchWithMongoFilters = async (parsed) => {
  try {
    const filter = buildMongoFilter(parsed);
    if (Object.keys(filter).length === 0) return [];
    return await Product.find(filter).limit(8);
  } catch (error) {
    console.error("[RAG] Mongo filter search failed:", error.message);
    return [];
  }
};

const searchWithPinecone = async (query, parsed) => {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const namespace = await get_namespace();

    const pineconeFilter = {};
    if (parsed.category) {
      pineconeFilter.category = { $eq: parsed.category };
    }
    if (parsed.maxPrice) {
      pineconeFilter.price = { $lte: parsed.maxPrice };
    }

    const queryOptions = {
      vector: queryEmbedding,
      topK: 10,
      includeMetadata: true,
    };
    if (Object.keys(pineconeFilter).length > 0) {
      queryOptions.filter = pineconeFilter;
    }

    const results = await namespace.query(queryOptions);

    const minScore = 0.75;
    const matchedIds = results.matches
      .filter((m) => m.score >= minScore)
      .map((m) => m.id);

    console.log(
      "[RAG] Pinecone scores:",
      results.matches.slice(0, 5).map((m) => `${m.id.slice(-6)}:${m.score.toFixed(3)}`),
      `| threshold: ${minScore} | passed: ${matchedIds.length}`,
    );

    if (matchedIds.length > 0) {
      return await Product.find({ _id: { $in: matchedIds } });
    }
    return [];
  } catch (error) {
    console.error("[RAG] Pinecone search failed:", error.message);
    return null;
  }
};

const searchWithKeywordRegex = async (query) => {
  try {
    const lower = query.toLowerCase();
    const cleaned = lower
      .replace(
        /\b(show|me|the|a|an|some|any|i|want|to|buy|find|get|need|looking|for|of|with|and|or|in|on|at|do|you|have|has|does|is|are|can|could|would|should|will|please|recommend|suggest|give|tell|list|best|cheap|good|great|really|very|just|about|from|product|products|item|items)\b/gi,
        " ",
      )
      .replace(/[?!.,;:'"()₹$]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) return [];

    const regexParts = cleaned.split(/\s+/).filter((w) => w.length > 1);
    if (regexParts.length === 0) return [];

    const regex = new RegExp(regexParts.join("|"), "i");
    return await Product.find({
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { category: { $regex: regex } },
      ],
    }).limit(8);
  } catch (error) {
    console.error("[RAG] Keyword regex search failed:", error.message);
    return [];
  }
};

const searchProducts = async (query, conversationHistory) => {
  const trimmedQuery = (query || "").trim();
  if (!trimmedQuery) return [];

  if (isGreeting(trimmedQuery)) {
    console.log("[RAG] Greeting detected, returning no products");
    return [];
  }

  const parsed = parseQuery(trimmedQuery);
  console.log("[RAG] Parsed query:", JSON.stringify(parsed));

  if (conversationHistory && conversationHistory.length > 0) {
    const lastAssistantMsg = [...conversationHistory]
      .reverse()
      .find((m) => m.role === "assistant");
    if (lastAssistantMsg) {
      const followUpPatterns = [
        /(?:show|what about|any|got|have)\s+(?:me\s+)?(?:the\s+)?(?:same|those|similar|more)/i,
        /(?:any|what about|show)\s+(?:other|more|different)/i,
        /(?:cheaper|expensive|bigger|smaller|different color)/i,
        /(?:pink|black|white|red|blue|green|yellow|brown)\s+(?:ones?|colored?)/i,
      ];
      const isFollowUp = followUpPatterns.some((p) => p.test(trimmedQuery));
      if (isFollowUp && !parsed.isProductQuery) {
        const colorMatch = trimmedQuery.match(
          /\b(pink|black|white|red|blue|green|yellow|brown|grey|gray|navy|beige|purple|orange)\b/i,
        );
        if (colorMatch) {
          parsed.colors.push(colorMatch[1].toLowerCase());
          parsed.isProductQuery = true;
        }
      }
    }
  }

  if (!parsed.isProductQuery) {
    const lower = trimmedQuery.toLowerCase();
    const productPhrases = [
      "products", "available", "stock", "what do you have",
      "what products", "show me", "recommend", "suggest",
      "looking for", "need", "want to buy", "price", "how much",
    ];
    const mightNeedProducts = productPhrases.some((p) => lower.includes(p));
    if (!mightNeedProducts) {
      console.log("[RAG] Not a product query, returning no products");
      return [];
    }
  }

  const nameResults = await searchByProductName(trimmedQuery);
  if (nameResults.length > 0) {
    let filtered = nameResults;
    if (parsed.colors.length > 0) {
      filtered = nameResults.filter((p) => {
        const text = `${p.name} ${p.description}`.toLowerCase();
        return parsed.colors.some((c) => text.includes(c));
      });
      if (filtered.length === 0) filtered = nameResults;
    }
    if (parsed.maxPrice) {
      const priceFiltered = filtered.filter((p) => p.price <= parsed.maxPrice);
      if (priceFiltered.length > 0) filtered = priceFiltered;
    }
    console.log("[RAG] Name search returned:", filtered.length, "products");
    return filtered;
  }

  let products = await searchWithPinecone(trimmedQuery, parsed);
  console.log("[RAG] Pinecone results:", products === null ? "FAILED" : products.length);

  if (products === null || products.length === 0) {
    const mongoResults = await searchWithMongoFilters(parsed);
    console.log("[RAG] Mongo filter results:", mongoResults.length);
    if (mongoResults.length > 0) {
      products = mongoResults;
    }
  }

  if (products.length > 0 && parsed.colors.length > 0) {
    products = products.filter((p) => {
      const text = `${p.name} ${p.description}`.toLowerCase();
      return parsed.colors.some((c) => text.includes(c));
    });
    console.log("[RAG] After color filter:", products.length);
  }

  if (products.length > 0) {
    return products;
  }

  const keywordResults = await searchWithKeywordRegex(trimmedQuery);
  console.log("[RAG] Keyword regex results:", keywordResults.length);
  return keywordResults;
};

const generateAIResponse = async (query, products, conversationHistory) => {
  const trimmedQuery = (query || "").trim();

  if (isGreeting(trimmedQuery)) {
    return "Hello! Welcome to ShopNest. I can help you find products, check prices, or recommend items. What are you looking for today?";
  }

  const parsed = parseQuery(trimmedQuery);

  if (products.length === 0 && !parsed.isProductQuery) {
    return "I'm here to help you find products! You can ask me things like:\n\n• \"Show me shoes\"\n• \"Electronics under ₹5000\"\n• \"Black dresses\"\n• \"Best deals\"\n\nWhat would you like to find?";
  }

  if (products.length === 0) {
    const searchTerm = trimmedQuery
      .replace(/\b(show|me|the|a|an|some|any|i|want|to|buy|find|get|need|looking|for|of|with|and|or|do|you|have|is|are|can|could|would|should|will|please|recommend|suggest|give|tell|list|best|cheap|good|great|really|very|just|about|from|product|products|item|items|available|stock|under|below|less|than|max|budget|price|how|much)\b/gi, "")
      .replace(/[?!.,;:'"()₹$]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const hints = [];
    if (parsed.category) hints.push(`category "${parsed.category}"`);
    if (parsed.colors.length > 0) hints.push(`color "${parsed.colors.join(", ")}"`);
    if (parsed.maxPrice) hints.push(`price under ₹${parsed.maxPrice}`);
    const hintStr = hints.length > 0 ? ` (looking for ${hints.join(", ")})` : "";

    if (searchTerm.length > 2) {
      return `Sorry, "${searchTerm}" is currently unavailable in our store.${hintStr} Would you like me to show you similar products?`;
    }

    return `Sorry, I couldn't find any products matching your request${hintStr}. Try adjusting your search or browse our Shop page for all available items.`;
  }

  const productContext = products
    .map(
      (p) =>
        `Product: ${p.name}\nDescription: ${p.description}\nPrice: ₹${p.price}\nCategory: ${p.category}\nStock: ${p.stock}\nID: ${p._id}`,
    )
    .join("\n\n");

  const conversationContext =
    conversationHistory && conversationHistory.length > 0
      ? "\n\nRecent conversation:\n" +
        conversationHistory
          .slice(-6)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")
      : "";

  const systemPrompt = `You are an AI shopping assistant for ShopNest, an e-commerce store.

CRITICAL RULES:
1. Answer using ONLY the products provided in the context below. MongoDB is the source of truth.
2. NEVER invent products, prices, discounts, stock, specifications, or availability.
3. If a specific product is requested and it is in the context, show ONLY that product.
4. If a specific product is requested but NOT in the context, say it is unavailable. Do NOT show unrelated products as substitutes.
5. If products match the query, list them with name, price, stock status, and brief description.
6. For out-of-stock products, mention they are currently out of stock.
7. Keep responses concise. Use ₹ for prices.
8. You can reference earlier conversation to understand follow-up questions.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      console.warn("[RAG] Gemini API key not configured, using fallback response");
      const list = products
        .map((p) => {
          const stockStatus = p.stock > 0 ? `In Stock (${p.stock})` : "Out of Stock";
          return `• ${p.name} - ₹${p.price} (${p.category}) [${stockStatus}]`;
        })
        .join("\n");
      return `Here are the products I found:\n\n${list}`;
    }

    const model = genAI.getGenerativeModel({
      model: LLM_MODEL,
      systemInstruction: systemPrompt,
    });

    const prompt = `User query: ${trimmedQuery}\n\nMatching products from our catalog:\n${productContext}${conversationContext}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    if (!text || !text.trim()) {
      throw new Error("Empty LLM response");
    }
    return text.trim();
  } catch (error) {
    console.error("[RAG] LLM error:", error.message);
    if (products.length > 0) {
      const list = products
        .map((p) => {
          const stockStatus = p.stock > 0 ? `In Stock (${p.stock})` : "Out of Stock";
          return `• ${p.name} - ₹${p.price} [${stockStatus}]`;
        })
        .join("\n");
      return `Here are the products that match your query:\n\n${list}`;
    }
    return "Sorry, I'm unable to process your request right now. Please try again.";
  }
};

module.exports = { searchProducts, generateAIResponse, isGreeting, parseQuery };
