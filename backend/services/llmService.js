const axios = require('axios');

// Generate response using LLM (e.g., OpenAI, Gemini)
const generateResponse = async (query, products) => {
  const context = products.map(p => `
  - ${p.name}: ₹${p.price} (${p.category})`).join('');
  
  // Fallback response if no products found
  if (products.length === 0) {
    return "I couldn't find any products matching your query. Try searching for something else!";
  }
  
  // Call LLM API (placeholder for OpenAI/Gemini)
  try {
    const prompt = `
      You are an AI shopping assistant. A user asked: "${query}"
      Here are some relevant products:
      ${context}
      
      Generate a concise response (max 2 sentences) suggesting the best products.
    `;
    
    // Replace with actual LLM API call
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('[llmService] Error:', error.message);
    return `Here are some products you might like:${context}`;
  }
};

module.exports = { generateResponse };