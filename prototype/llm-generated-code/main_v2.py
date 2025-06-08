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
                edge = TopologicalEdge(
                    source_id=edge_data["source_id"],
                    target_id=edge_data["target_id"],
                    edge_type=edge_data.get("edge_type", "connection"),
                    properties=edge_data.get("properties", {}),
                    symbol=edge_data.get("symbol", "→")
                )
                if "id" in edge_data:
                    edge.id = edge_data["id"]
                new_graph.add_edge(edge)
        
        # Modify existing nodes
        for node_data in changes.get("nodes_to_modify", []):
            if "id" in node_data and node_data["id"] in new_graph.nodes:
                node = new_graph.nodes[node_data["id"]]
                if "name" in node_data:
                    node.name = node_data["name"]
                if "node_type" in node_data:
                    node.node_type = node_data["node_type"]
                if "properties" in node_data:
                    node.properties.update(node_data["properties"])
                if "symbol" in node_data:
                    node.symbol = node_data["symbol"]
                if "stability" in node_data:
                    node.stability = node_data["stability"]
                if "activation" in node_data:
                    node.activation = node_data["activation"]
        
        # Modify existing edges
        for edge_data in changes.get("edges_to_modify", []):
            if "id" in edge_data and edge_data["id"] in new_graph.edges:
                edge = new_graph.edges[edge_data["id"]]
                if "edge_type" in edge_data:
                    edge.edge_type = edge_data["edge_type"]
                if "properties" in edge_data:
                    edge.properties.update(edge_data["properties"])
                if "symbol" in edge_data:
                    edge.symbol = edge_data["symbol"]
                if "strength" in edge_data:
                    edge.strength = edge_data["strength"]
        
        # Remove nodes
        for node_id in changes.get("nodes_to_remove", []):
            new_graph.remove_node(node_id)
        
        # Remove edges
        for edge_id in changes.get("edges_to_remove", []):
            new_graph.remove_edge(edge_id)
        
        return new_graph
    
    def execute_cognitive_function(self, 
                                  graph: TopologicalGraph, 
                                  function_name: str,
                                  input_nodes: List[str], 
                                  parameters: Dict[str, Any] = None,
                                  max_tokens: int = 4000) -> Dict[str, Any]:
        """
        Execute a cognitive function on a subgraph defined by input nodes
        
        Args:
            graph: The TopoGlyph graph
            function_name: The name of the cognitive function to execute
            input_nodes: List of node IDs that serve as input to the function
            parameters: Additional parameters for the function
            max_tokens: Maximum number of tokens in the response
            
        Returns:
            A dictionary with the results of the function execution
        """
        parameters = parameters or {}
        
        # Get the subgraph containing the input nodes
        subgraph_nodes = set(input_nodes)
        
        # Add direct connections between input nodes
        for edge in graph.edges.values():
            if edge.source_id in input_nodes and edge.target_id in input_nodes:
                subgraph_nodes.add(edge.source_id)
                subgraph_nodes.add(edge.target_id)
        
        # Create subgraph description
        subgraph_desc = []
        for node_id in subgraph_nodes:
            if node_id in graph.nodes:
                node = graph.nodes[node_id]
                subgraph_desc.append(f"{node.symbol} {node.name} ({node.node_type}): {json.dumps(node.properties)}")
        
        edge_desc = []
        for edge in graph.edges.values():
            if edge.source_id in subgraph_nodes and edge.target_id in subgraph_nodes:
                source = graph.nodes[edge.source_id].name
                target = graph.nodes[edge.target_id].name
                edge_desc.append(f"{source} {edge.symbol} {target} ({edge.edge_type})")
        
        # Construct the prompt
        user_message = f"""
        Execute the following TopoGlyph cognitive function:
        
        Function: {function_name}
        Parameters: {json.dumps(parameters, indent=2)}
        
        Input Nodes:
        {chr(10).join(subgraph_desc)}
        
        Connections:
        {chr(10).join(edge_desc)}
        
        Please execute this cognitive function and return:
        1. An explanation of the cognitive process
        2. The results of the function
        3. Any new nodes or edges to add to the graph
        4. Any modifications to existing nodes or edges
        """
        
        # Call the Anthropic API
        try:
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
                "function": function_name,
                "parameters": parameters,
                "input_nodes": input_nodes,
                "result_summary": result.get("summary", "Function executed")
            })
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "explanation": "An error occurred while executing the cognitive function"
            }

    def generate_insight(self, 
                        graph: TopologicalGraph, 
                        context: str,
                        max_tokens: int = 4000) -> Dict[str, Any]:
        """
        Generate insights from the graph based on the given context
        
        Args:
            graph: The TopoGlyph graph
            context: Additional context or questions to guide the insight generation
            max_tokens: Maximum number of tokens in the response
            
        Returns:
            A dictionary with the generated insights
        """
        # Construct the prompt
        user_message = f"""
        Generate insights from the following TopoGlyph graph:
        
        Graph: {graph.name}
        
        Nodes:
        {chr(10).join([f"{node.symbol} {node.name} ({node.node_type})" for node in graph.nodes.values()])}
        
        Connections:
        {chr(10).join([f"{graph.nodes[edge.source_id].name} {edge.symbol} {graph.nodes[edge.target_id].name}" 
                      for edge in graph.edges.values()])}
        
        Context for insight generation:
        {context}
        
        Please analyze this graph and generate insights based on the context.
        Consider topological features, patterns, and cognitive implications.
        """
        
        # Call the Anthropic API
        try:
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
                "operation": "generate_insight",
                "context": context,
                "result_summary": result.get("summary", "Insights generated")
            })
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "explanation": "An error occurred while generating insights"
            }


def create_sample_graph() -> TopologicalGraph:
    """Create a sample TopoGlyph graph for demonstration"""
    graph = TopologicalGraph(name="Sample TopoGlyph Graph")
    
    # Create some nodes
    n1 = TopologicalNode(name="Quantum Information", node_type="concept", symbol="■")
    n2 = TopologicalNode(name="Topological States", node_type="concept", symbol="■")
    n3 = TopologicalNode(name="Critical Transitions", node_type="process", symbol="▲")
    n4 = TopologicalNode(name="Information Paradox", node_type="contradiction", symbol="▨")
    n5 = TopologicalNode(name="Meta Processing", node_type="meta_process", symbol="◊")
    
    # Add nodes to graph
    n1_id = graph.add_node(n1)
    n2_id = graph.add_node(n2)
    n3_id = graph.add_node(n3)
    n4_id = graph.add_node(n4)
    n5_id = graph.add_node(n5)
    
    # Create edges
    e1 = TopologicalEdge(source_id=n1_id, target_id=n4_id, edge_type="contributes_to", symbol="→")
    e2 = TopologicalEdge(source_id=n2_id, target_id=n4_id, edge_type="contributes_to", symbol="→")
    e3 = TopologicalEdge(source_id=n4_id, target_id=n3_id, edge_type="triggers", symbol="⟿")
    e4 = TopologicalEdge(source_id=n5_id, target_id=n3_id, edge_type="monitors", symbol="⥁")
    e5 = TopologicalEdge(source_id=n3_id, target_id=n1_id, edge_type="transforms", symbol="≫")
    
    # Add edges to graph
    graph.add_edge(e1)
    graph.add_edge(e2)
    graph.add_edge(e3)
    graph.add_edge(e4)
    graph.add_edge(e5)
    
    return graph


def main():
    """Main function to run the TopoGlyph executor"""
    parser = argparse.ArgumentParser(description="TopoGlyph Executor")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new TopoGlyph graph")
    create_parser.add_argument("--name", default="New TopoGlyph Graph", help="Name of the new graph")
    create_parser.add_argument("--output", default="topoglyph_graph.json", help="Output file path")
    
    # Load command
    load_parser = subparsers.add_parser("load", help="Load a TopoGlyph graph from file")
    load_parser.add_argument("input", help="Input file path")
    
    # Execute command
    execute_parser = subparsers.add_parser("execute", help="Execute an operation on a graph")
    execute_parser.add_argument("input", help="Input graph file path")
    execute_parser.add_argument("operation", help="Operation to execute")
    execute_parser.add_argument("--params", help="JSON parameters for the operation")
    execute_parser.add_argument("--output", help="Output file path for the modified graph")
    
    # Function command
    function_parser = subparsers.add_parser("function", help="Execute a cognitive function")
    function_parser.add_argument("input", help="Input graph file path")
    function_parser.add_argument("function", help="Cognitive function to execute")
    function_parser.add_argument("--nodes", help="Comma-separated list of input node IDs")
    function_parser.add_argument("--params", help="JSON parameters for the function")
    function_parser.add_argument("--output", help="Output file path for the modified graph")
    
    # Insight command
    insight_parser = subparsers.add_parser("insight", help="Generate insights from a graph")
    insight_parser.add_argument("input", help="Input graph file path")
    insight_parser.add_argument("--context", default="Generate general insights", help="Context for insight generation")
    
    # Sample command
    sample_parser = subparsers.add_parser("sample", help="Create a sample graph")
    sample_parser.add_argument("--output", default="sample_graph.json", help="Output file path")
    
    # Visualize command
    visualize_parser = subparsers.add_parser("visualize", help="Visualize a graph")
    visualize_parser.add_argument("input", help="Input graph file path")
    
    args = parser.parse_args()
    
    # Initialize the executor
    executor = TopoGlyphExecutor()
    
    if args.command == "create":
        graph = TopologicalGraph(name=args.name)
        graph.save_to_file(args.output)
        print(f"Created new graph '{args.name}' and saved to {args.output}")
    
    elif args.command == "load":
        graph = TopologicalGraph.load_from_file(args.input)
        print(f"Loaded graph '{graph.name}' with {len(graph.nodes)} nodes and {len(graph.edges)} edges")
    
    elif args.command == "execute":
        graph = TopologicalGraph.load_from_file(args.input)
        params = json.loads(args.params) if args.params else {}
        
        print(f"Executing operation '{args.operation}' on graph '{graph.name}'...")
        result = executor.execute_operation(graph, args.operation, params, stream=True)
        
        if result.get("success", False):
            # Apply changes to the graph
            modified_graph = executor.apply_changes_to_graph(graph, result.get("changes", {}))
            
            # Save the modified graph
            output_path = args.output or args.input
            modified_graph.save_to_file(output_path)
            
            print(f"\nOperation completed and saved to {output_path}")
        else:
            print(f"\nOperation failed: {result.get('error', 'Unknown error')}")
    
    elif args.command == "function":
        graph = TopologicalGraph.load_from_file(args.input)
        node_ids = args.nodes.split(",") if args.nodes else []
        params = json.loads(args.params) if args.params else {}
        
        print(f"Executing function '{args.function}' on graph '{graph.name}'...")
        result = executor.execute_cognitive_function(graph, args.function, node_ids, params)
        
        print(result.get("explanation", ""))
        
        if result.get("success", False):
            # Apply changes to the graph
            modified_graph = executor.apply_changes_to_graph(graph, result.get("changes", {}))
            
            # Save the modified graph
            if args.output:
                modified_graph.save_to_file(args.output)
                print(f"Modified graph saved to {args.output}")
        else:
            print(f"Function execution failed: {result.get('error', 'Unknown error')}")
    
    elif args.command == "insight":
        graph = TopologicalGraph.load_from_file(args.input)
        
        print(f"Generating insights for graph '{graph.name}'...")
        result = executor.generate_insight(graph, args.context)
        
        print("\nInsights:")
        print(result.get("explanation", "No insights generated"))
    
    elif args.command == "sample":
        graph = create_sample_graph()
        graph.save_to_file(args.output)
        print(f"Created sample graph and saved to {args.output}")
        print("\nGraph preview:")
        print(graph.visualize_as_text())
    
    elif args.command == "visualize":
        graph = TopologicalGraph.load_from_file(args.input)
        print(graph.visualize_as_text())
        print("\nTopoGlyph Notation:")
        print(graph.create_topoglyph_notation())
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()