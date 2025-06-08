"""
TopoGlyph Executable Implementation with Anthropic API

This module implements TopoGlyph as a RAG application using the Anthropic API.
The application can create, manipulate, and "execute" TopoGlyph graphs by
leveraging Claude as the cognitive engine.
"""

import os
import json
import argparse
from typing import Dict, List, Any, Optional, Tuple, Union
import anthropic
from anthropic.types import ContentBlockDeltaEvent
from dotenv import load_dotenv

from graph import TopologicalGraph, TopologicalNode, TopologicalEdge

# Load environment variables from .env file
load_dotenv()

class TopoGlyphExecutor:
    """
    A class that executes TopoGlyph operations using the Anthropic API
    """
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the executor with an API key"""
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key not provided and not found in environment")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-3-sonnet-20240229"
        self.system_prompt = """
        You are TopoGlyph, an executable cognitive calculus system that uses topological operations
        to model and transform knowledge structures. You are an expert in executing TopoGlyph operations
        on knowledge graphs.
        
        When responding, format your output in a way that's compatible with JSON parsing:
        1. Start with a brief explanation
        2. Followed by a JSON object with the results, enclosed in ```json and ``` markers
        
        TopoGlyph operations should preserve topological properties and relationships.
        """
        
        # Keep a history of operations for context
        self.operation_history = []
        
    def execute_operation(self, 
                         graph: TopologicalGraph, 
                         operation: str,
                         parameters: Dict[str, Any] = None,
                         max_tokens: int = 4000,
                         stream: bool = False) -> Dict[str, Any]:
        """
        Execute a TopoGlyph operation on the graph
        
        Args:
            graph: The TopoGlyph graph to operate on
            operation: The operation to perform
            parameters: Additional parameters for the operation
            max_tokens: Maximum number of tokens in the response
            stream: Whether to stream the response
            
        Returns:
            A dictionary with the results of the operation
        """
        parameters = parameters or {}
        
        # Create a context with the graph state and operation details
        context = {
            "graph_summary": graph.get_topological_summary(),
            "operation": operation,
            "parameters": parameters,
            "topoglyph_notation": graph.create_topoglyph_notation()
        }
        
        # Add the most recent operations for context (limit to 5)
        if self.operation_history:
            context["recent_operations"] = self.operation_history[-5:]
        
        # Construct the prompt
        user_message = f"""
        Execute the following TopoGlyph operation:
        
        Operation: {operation}
        Parameters: {json.dumps(parameters, indent=2)}
        
        Current Graph State:
        {graph.visualize_as_text()}
        
        TopoGlyph Notation:
        {graph.create_topoglyph_notation()}
        
        Please execute this operation and return:
        1. An explanation of what changes were made
        2. Any new nodes or edges to add to the graph
        3. Any modifications to existing nodes or edges
        4. Any nodes or edges to remove
        """
        
        # Call the Anthropic API
        try:
            if stream:
                result_text = ""
                for event in self.client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens,
                    system=self.system_prompt,
                    messages=[
                        {"role": "user", "content": user_message}
                    ],
                    stream=True
                ):
                    if isinstance(event, ContentBlockDeltaEvent):
                        result_text += event.delta.text
                        if stream:
                            print(event.delta.text, end="", flush=True)
                response_text = result_text
            else:
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens,
                    system=self.system_prompt,
                    messages=[
                        {"role": "user", "content": user_message}
                    ]
                )
                response_text = response.content[0].text
            
            # Extract the JSON part
            result = self._extract_json(response_text)
            
            # Add to operation history
            self.operation_history.append({
                "operation": operation,
                "parameters": parameters,
                "result_summary": result.get("summary", "Operation completed")
            })
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "explanation": "An error occurred while executing the operation"
            }
    
    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract JSON from the response text"""
        # Look for JSON between ```json and ``` markers
        json_start = text.find("```json")
        if json_start != -1:
            json_start += 7  # Length of ```json
            json_end = text.find("```", json_start)
            if json_end != -1:
                json_str = text[json_start:json_end].strip()
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass
        
        # If no valid JSON found, try to create a simple result
        return {
            "success": True,
            "explanation": text,
            "changes": {
                "nodes_to_add": [],
                "edges_to_add": [],
                "nodes_to_modify": [],
                "edges_to_modify": [],
                "nodes_to_remove": [],
                "edges_to_remove": []
            }
        }
    
    def apply_changes_to_graph(self, graph: TopologicalGraph, changes: Dict[str, Any]) -> TopologicalGraph:
        """
        Apply the changes returned by the executor to the graph
        
        Args:
            graph: The original graph
            changes: The changes to apply
            
        Returns:
            The modified graph
        """
        # Create a deep copy of the graph to avoid modifying the original
        new_graph = TopologicalGraph.from_dict(graph.to_dict())
        
        # Add new nodes
        for node_data in changes.get("nodes_to_add", []):
            if "name" in node_data:
                node = TopologicalNode(
                    name=node_data["name"],
                    node_type=node_data.get("node_type", "concept"),
                    properties=node_data.get("properties", {}),
                    symbol=node_data.get("symbol", "■")
                )
                if "id" in node_data:
                    node.id = node_data["id"]
                new_graph.add_node(node)
        
        # Add new edges
        for edge_data in changes.get("edges_to_add", []):
            if "source_id" in edge_data and "target_id" in edge_data:
                edge = TopologicalE