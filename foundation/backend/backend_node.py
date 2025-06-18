# https://github.com/pathwaycom/llm-app/tree/main/examples/pipelines/demo-question-answering

# 
import os
from typing import Optional
from dotenv import load_dotenv
from langchain_core.utils.utils import secret_from_env
from langchain_openai import ChatOpenAI
from pydantic import Field, SecretStr

# property graph index
from typing import Literal
from llama_index.core.indices.property_graph import SchemaLLMPathExtractor

# load environment variables
load_dotenv()

# recommended uppercase, underscore separated
entities = Literal["PERSON", "PLACE", "THING"]
relations = Literal["PART_OF", "HAS", "IS_A"]
schema = {
    "PERSON": ["PART_OF", "HAS", "IS_A"],
    "PLACE": ["PART_OF", "HAS"],
    "THING": ["IS_A"],
}

# what is this?
kg_extractor = SchemaLLMPathExtractor(
    llm=llm,
    possible_entities=entities,
    possible_relations=relations,
    kg_validation_schema=schema,
    strict=True,  # if false, will allow triplets outside of the schema
    num_workers=4,
    max_triplets_per_chunk=10,
)

# supposed to enable OpenRouter integration
# with langchain bc doesn't default support
class ChatOpenRouter(ChatOpenAI):
    openai_api_key: Optional[SecretStr] = Field(
        alias="api_key",
        default_factory=secret_from_env("OPENROUTER_API_KEY", default=None),
    )
    @property
    def lc_secrets(self) -> dict[str, str]:
        return {"openai_api_key": "OPENROUTER_API_KEY"}

    def __init__(self, openai_api_key: Optional[str] = None, **kwargs):
        openai_api_key = (
            openai_api_key or os.environ.get("OPENROUTER_API_KEY")
        )
        super().__init__(
            base_url="https://openrouter.ai/api/v1",
            openai_api_key=openai_api_key,
            **kwargs
        )

openrouter_model = ChatOpenRouter(
    model_name="anthropic/claude-3.7-sonnet:thinking"
)

# maps: instructions of rule application
#       representable over the graph
#       partly invisible, higher-d
# ( metacognition instructions as system prompt )
# ( looks really freaking cool to navigate high-d space)
# {
#   metacognition system prompt,
#   configuration + labeled/ordered set of text documents,
#   self-model develops from iterative application of metacognition,
#   may add dimensions to model - form, function, material,
#   through similar recursive self-reflect process,
# }
ai_systems = []

# how can i communicate with models more meaningfully?
# develop more intentional communication frameworks
# atm an ensemble of thinking languages
conversations = []
