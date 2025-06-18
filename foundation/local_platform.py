from llama_index.core import SimpleDirectoryReader, KnowledgeGraphIndex
from llama_index.core.graph_stores import SimpleGraphStore
from llama_index.llms.openrouter import OpenRouter
from llama_index.core.llms import ChatMessage 
from llama_index.core import Settings, StorageContext

# 1. Storage
# 2. Compute
# 3. Networking

# 4. Interface
# {}

llm = OpenRouter(
    api_key="",
    max_tokens=256,
    model=""
)

documents = SimpleDirectoryReader("./data")
graph_store = SimpleGraphStore()
storage_context = StorageContext.from_defaults(graph_store=graph_store)

# My Stuff as I Understand It
how_i_be = {
    "feeling": {},
    "sleeping": {},
    "having problems": {},
}