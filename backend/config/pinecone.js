const { Pinecone } = require("@pinecone-database/pinecone");

let pineconeClient = null;

const getPineconeClient = () => {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
};

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "shopnest-products";
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "products";

const get_index = async () => {
  const client = getPineconeClient();
  return client.index(PINECONE_INDEX_NAME);
};

const get_namespace = async () => {
  const index = await get_index();
  return index.namespace(PINECONE_NAMESPACE);
};

module.exports = { getPineconeClient, get_index, get_namespace, PINECONE_INDEX_NAME, PINECONE_NAMESPACE };
