"""
TopoGlyph Graph Abstraction

This module provides the core graph data structure for representing 
TopoGlyph concepts and operations.
"""

from typing import Dict, List, Set, Any, Optional, Tuple, Union
import uuid
import json

class TopologicalNode:
    """
    Represents a node in the TopoGlyph system with topological properties.
    """
    def __init__(self, 
                 name: str, 
                 node_type: str = "concept", 
                 properties: Dict[str, Any] = None,
                 symbol: str = "■"):
        self.id = str(uuid.uuid4())
        self.name = name
        self.node_type = node_type
        self.properties = properties or {}
        self.symbol = symbol
        self.stability = 1.0  # Represents conceptual stability (0.0-1.0)
        self.activation = 0.0  # Current activation level
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert node to dictionary for serialization"""
        return {
            "id": self.id,
            "name": self.name,
            "node_type": self.node_type,
            "properties": self.properties,
            "symbol": self.symbol,
            "stability": self.stability,
            "activation": self.activation
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'TopologicalNode':
        """Create node from dictionary"""
        node = TopologicalNode(
            name=data["name"],
            node_type=data["node_type"],
            properties=data["properties"],
            symbol=data["symbol"]
        )
        node.id = data["id"]
        node.stability = data["stability"]
        node.activation = data["activation"]
        return node
    
    def __repr__(self) -> str:
        return f"{self.symbol} {self.name} ({self.node_type})"


class TopologicalEdge:
    """
    Represents a connection between nodes with topological properties.
    """
    def __init__(self, 
                 source_id: str, 
                 target_id: str, 
                 edge_type: str = "connection",
                 properties: Dict[str, Any] = None,
                 symbol: str = "→"):
        self.id = str(uuid.uuid4())
        self.source_id = source_id
        self.target_id = target_id
        self.edge_type = edge_type
        self.properties = properties or {}
        self.symbol = symbol
        self.strength = 1.0  # Represents connection strength (0.0-1.0)
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert edge to dictionary for serialization"""
        return {
            "id": self.id,
            "source_id": self.source_id,
            "target_id": self.target_id,
            "edge_type": self.edge_type,
            "properties": self.properties,
            "symbol": self.symbol,
            "strength": self.strength
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'TopologicalEdge':
        """Create edge from dictionary"""
        edge = TopologicalEdge(
            source_id=data["source_id"],
            target_id=data["target_id"],
            edge_type=data["edge_type"],
            properties=data["properties"],
            symbol=data["symbol"]
        )
        edge.id = data["id"]
        edge.strength = data["strength"]
        return edge
    
    def __repr__(self) -> str:
        return f"{self.source_id} {self.symbol} {self.target_id} ({self.edge_type})"


class TopologicalGraph:
    """
    Represents a graph of TopoGlyph nodes and edges with topological operations.
    """
    def __init__(self, name: str = "TopoGlyph Graph"):
        self.name = name
        self.nodes: Dict[str, TopologicalNode] = {}
        self.edges: Dict[str, TopologicalEdge] = {}
        self.metadata: Dict[str, Any] = {
            "version": "1.0",
            "description": "TopoGlyph graph representation"
        }
    
    def add_node(self, node: TopologicalNode) -> str:
        """Add a node to the graph and return its ID"""
        self.nodes[node.id] = node
        return node.id
    
    def add_edge(self, edge: TopologicalEdge) -> str:
        """Add an edge to the graph and return its ID"""
        # Ensure the source and target nodes exist
        if edge.source_id not in self.nodes or edge.target_id not in self.nodes:
            raise ValueError("Source or target node does not exist")
        
        self.edges[edge.id] = edge
        return edge.id
    
    def get_node(self, node_id: str) -> Optional[TopologicalNode]:
        """Get a node by ID"""
        return self.nodes.get(node_id)
    
    def get_edge(self, edge_id: str) -> Optional[TopologicalEdge]:
        """Get an edge by ID"""
        return self.edges.get(edge_id)
    
    def get_node_by_name(self, name: str) -> Optional[TopologicalNode]:
        """Get a node by name"""
        for node in self.nodes.values():
            if node.name == name:
                return node
        return None
    
    def get_neighbors(self, node_id: str) -> List[TopologicalNode]:
        """Get all neighbor nodes connected to the given node"""
        neighbors = []
        for edge in self.edges.values():
            if edge.source_id == node_id:
                neighbors.append(self.nodes[edge.target_id])
            elif edge.target_id == node_id:
                neighbors.append(self.nodes[edge.source_id])
        return neighbors
    
    def get_outgoing_edges(self, node_id: str) -> List[TopologicalEdge]:
        """Get all edges where the given node is the source"""
        return [edge for edge in self.edges.values() if edge.source_id == node_id]
    
    def get_incoming_edges(self, node_id: str) -> List[TopologicalEdge]:
        """Get all edges where the given node is the target"""
        return [edge for edge in self.edges.values() if edge.target_id == node_id]
    
    def remove_node(self, node_id: str) -> None:
        """
        Remove a node and all its connected edges from the graph
        """
        if node_id not in self.nodes:
            return
        
        # Remove all edges connected to this node
        edges_to_remove = []
        for edge_id, edge in self.edges.items():
            if edge.source_id == node_id or edge.target_id == node_id:
                edges_to_remove.append(edge_id)
        
        for edge_id in edges_to_remove:
            del self.edges[edge_id]
        
        # Remove the node
        del self.nodes[node_id]
    
    def remove_edge(self, edge_id: str) -> None:
        """Remove an edge from the graph"""
        if edge_id in self.edges:
            del self.edges[edge_id]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert graph to dictionary for serialization"""
        return {
            "name": self.name,
            "nodes": {node_id: node.to_dict() for node_id, node in self.nodes.items()},
            "edges": {edge_id: edge.to_dict() for edge_id, edge in self.edges.items()},
            "metadata": self.metadata
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'TopologicalGraph':
        """Create graph from dictionary"""
        graph = TopologicalGraph(name=data["name"])
        graph.metadata = data["metadata"]
        
        # Add all nodes first
        for node_id, node_data in data["nodes"].items():
            node = TopologicalNode.from_dict(node_data)
            graph.nodes[node_id] = node
        
        # Then add all edges
        for edge_id, edge_data in data["edges"].items():
            edge = TopologicalEdge.from_dict(edge_data)
            graph.edges[edge_id] = edge
        
        return graph
    
    def save_to_file(self, filepath: str) -> None:
        """Save graph to a JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @staticmethod
    def load_from_file(filepath: str) -> 'TopologicalGraph':
        """Load graph from a JSON file"""
        with open(filepath, 'r') as f:
            data = json.load(f)
        return TopologicalGraph.from_dict(data)
    
    def get_topological_summary(self) -> Dict[str, Any]:
        """Get a summary of topological properties of the graph"""
        # Count node types
        node_types = {}
        for node in self.nodes.values():
            node_types[node.node_type] = node_types.get(node.node_type, 0) + 1
        
        # Count edge types
        edge_types = {}
        for edge in self.edges.values():
            edge_types[edge.edge_type] = edge_types.get(edge.edge_type, 0) + 1
        
        # Calculate basic network metrics
        avg_degree = len(self.edges) * 2 / max(1, len(self.nodes))
        
        # Find connected components
        components = self._find_connected_components()
        
        return {
            "node_count": len(self.nodes),
            "edge_count": len(self.edges),
            "node_types": node_types,
            "edge_types": edge_types,
            "average_degree": avg_degree,
            "connected_components": len(components),
            "largest_component_size": max([len(c) for c in components]) if components else 0
        }
    
    def _find_connected_components(self) -> List[Set[str]]:
        """Find all connected components in the graph"""
        components = []
        visited = set()
        
        for node_id in self.nodes:
            if node_id not in visited:
                # Start a new component
                component = set()
                self._dfs(node_id, visited, component)
                components.append(component)
        
        return components
    
    def _dfs(self, node_id: str, visited: Set[str], component: Set[str]) -> None:
        """Depth-first search to find connected components"""
        visited.add(node_id)
        component.add(node_id)
        
        for edge in self.edges.values():
            if edge.source_id == node_id and edge.target_id not in visited:
                self._dfs(edge.target_id, visited, component)
            elif edge.target_id == node_id and edge.source_id not in visited:
                self._dfs(edge.source_id, visited, component)
    
    def visualize_as_text(self) -> str:
        """
        Generate a simple text visualization of the graph
        """
        result = [f"=== {self.name} ==="]
        result.append("\nNodes:")
        for node in self.nodes.values():
            result.append(f"  {node.symbol} {node.name} ({node.node_type})")
        
        result.append("\nEdges:")
        for edge in self.edges.values():
            source = self.nodes[edge.source_id].name
            target = self.nodes[edge.target_id].name
            result.append(f"  {source} {edge.symbol} {target} ({edge.edge_type})")
        
        return "\n".join(result)

    def create_topoglyph_notation(self) -> str:
        """
        Generate a TopoGlyph notation string representing the graph
        """
        # For simplicity, we'll generate a linear representation
        # More complex layouts would require graph layout algorithms
        components = self._find_connected_components()
        
        notation_parts = []
        
        for component in components:
            # Create a subgraph of just this component for easier processing
            subgraph = {}
            for node_id in component:
                subgraph[node_id] = {
                    "node": self.nodes[node_id],
                    "outgoing": self.get_outgoing_edges(node_id),
                    "incoming": self.get_incoming_edges(node_id)
                }
            
            # Try to find a starting node (one with no incoming edges or the first one)
            start_node_id = next((n for n in component if not subgraph[n]["incoming"]), next(iter(component)))
            
            # Generate a path through the component
            path = []
            visited = set()
            self._generate_path(start_node_id, subgraph, visited, path)
            
            # Convert path to notation
            if path:
                notation = self._path_to_notation(path, subgraph)
                notation_parts.append(notation)
        
        return " ".join(notation_parts)
    
    def _generate_path(self, 
                       node_id: str, 
                       subgraph: Dict[str, Dict], 
                       visited: Set[str], 
                       path: List[Dict[str, Any]]) -> None:
        """
        Generate a path through the graph using DFS
        """
        if node_id in visited:
            return
        
        visited.add(node_id)
        node_info = subgraph[node_id]
        
        # Add this node to the path
        path.append({"type": "node", "id": node_id})
        
        # Follow outgoing edges
        for edge in node_info["outgoing"]:
            path.append({"type": "edge", "id": edge.id})
            self._generate_path(edge.target_id, subgraph, visited, path)
    
    def _path_to_notation(self, 
                         path: List[Dict[str, Any]], 
                         subgraph: Dict[str, Dict]) -> str:
        """
        Convert a path to TopoGlyph notation
        """
        notation = []
        for item in path:
            if item["type"] == "node":
                node = subgraph[item["id"]]["node"]
                notation.append(node.symbol)
            else:  # edge
                edge = self.edges[item["id"]]
                notation.append(edge.symbol)
        
        return " ".join(notation)

    def apply_transformation(self, transformation_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply a transformation to the graph and return the result
        """
        results = {
            "transformation_type": transformation_type,
            "parameters": parameters,
            "success": False,
            "message": "",
            "affected_nodes": [],
            "affected_edges": []
        }
        
        try:
            if transformation_type == "merge_nodes":
                # Merge two or more nodes into a new node
                node_ids = parameters.get("node_ids", [])
                new_name = parameters.get("new_name", "Merged Node")
                new_type = parameters.get("new_type", "merged_concept")
                new_symbol = parameters.get("new_symbol", "■*")
                
                if len(node_ids) < 2:
                    raise ValueError("Need at least two nodes to merge")
                
                # Create a new node with combined properties
                merged_props = {}
                for node_id in node_ids:
                    if node_id in self.nodes:
                        node_props = self.nodes[node_id].properties
                        for key, value in node_props.items():
                            if key in merged_props:
                                # For simplicity, we'll just append values if the key already exists
                                if isinstance(merged_props[key], list):
                                    merged_props[key].append(value)
                                else:
                                    merged_props[key] = [merged_props[key], value]
                            else:
                                merged_props[key] = value
                
                # Create the new merged node
                new_node = TopologicalNode(
                    name=new_name,
                    node_type=new_type,
                    properties=merged_props,
                    symbol=new_symbol
                )
                new_node_id = self.add_node(new_node)
                
                # Connect the new node to all neighbors of the merged nodes
                for node_id in node_ids:
                    if node_id in self.nodes:
                        # Get all neighbors before removing the node
                        incoming = self.get_incoming_edges(node_id)
                        outgoing = self.get_outgoing_edges(node_id)
                        
                        # Create new edges to/from neighbors
                        for edge in incoming:
                            if edge.source_id not in node_ids:  # Avoid edges between merged nodes
                                new_edge = TopologicalEdge(
                                    source_id=edge.source_id,
                                    target_id=new_node_id,
                                    edge_type=edge.edge_type,
                                    properties=edge.properties.copy(),
                                    symbol=edge.symbol
                                )
                                self.add_edge(new_edge)
                                results["affected_edges"].append(new_edge.id)
                        
                        for edge in outgoing:
                            if edge.target_id not in node_ids:  # Avoid edges between merged nodes
                                new_edge = TopologicalEdge(
                                    source_id=new_node_id,
                                    target_id=edge.target_id,
                                    edge_type=edge.edge_type,
                                    properties=edge.properties.copy(),
                                    symbol=edge.symbol
                                )
                                self.add_edge(new_edge)
                                results["affected_edges"].append(new_edge.id)
                
                # Remove the merged nodes
                for node_id in node_ids:
                    self.remove_node(node_id)
                
                results["success"] = True
                results["message"] = f"Successfully merged {len(node_ids)} nodes into {new_name}"
                results["affected_nodes"].append(new_node_id)
            
            elif transformation_type == "create_subgraph":
                # Extract a subgraph around specified nodes
                center_node_ids = parameters.get("center_node_ids", [])
                depth = parameters.get("depth", 1)
                include_center = parameters.get("include_center", True)
                
                if not center_node_ids:
                    raise ValueError("Need at least one center node")
                
                # Find all nodes within the specified depth
                nodes_in_subgraph = set()
                if include_center:
                    nodes_in_subgraph.update(center_node_ids)
                
                current_layer = set(center_node_ids)
                for _ in range(depth):
                    next_layer = set()
                    for node_id in current_layer:
                        for neighbor in self.get_neighbors(node_id):
                            next_layer.add(neighbor.id)
                    nodes_in_subgraph.update(next_layer)
                    current_layer = next_layer
                
                # Create a new graph with just these nodes
                subgraph = TopologicalGraph(name=f"Subgraph of {self.name}")
                
                # Add all nodes from the subgraph
                for node_id in nodes_in_subgraph:
                    if node_id in self.nodes:
                        node = self.nodes[node_id]
                        subgraph.add_node(TopologicalNode.from_dict(node.to_dict()))
                
                # Add all edges between nodes in the subgraph
                for edge in self.edges.values():
                    if edge.source_id in nodes_in_subgraph and edge.target_id in nodes_in_subgraph:
                        subgraph.add_edge(TopologicalEdge.from_dict(edge.to_dict()))
                
                results["success"] = True
                results["message"] = f"Created subgraph with {len(subgraph.nodes)} nodes and {len(subgraph.edges)} edges"
                results["subgraph"] = subgraph.to_dict()
            
            elif transformation_type == "eigenpattern_extraction":
                # Extract common patterns from multiple paths
                path_node_lists = parameters.get("paths", [])
                min_pattern_length = parameters.get("min_length", 2)
                
                if len(path_node_lists) < 2:
                    raise ValueError("Need at least two paths to extract patterns")
                
                # Convert node names to node IDs if needed
                paths = []
                for path in path_node_lists:
                    node_path = []
                    for node_id_or_name in path:
                        if node_id_or_name in self.nodes:
                            node_path.append(node_id_or_name)
                        else:
                            # Try to find by name
                            node = self.get_node_by_name(node_id_or_name)
                            if node:
                                node_path.append(node.id)
                    paths.append(node_path)
                
                # Find common subsequences across paths
                # This is a simplified algorithm - more sophisticated algorithms exist
                patterns = []
                for i in range(len(paths[0])):
                    for length in range(min_pattern_length, len(paths[0]) - i + 1):
                        pattern = paths[0][i:i+length]
                        if all(self._is_subsequence(pattern, path) for path in paths[1:]):
                            patterns.append(pattern)
                
                # Create a new pattern node for each found pattern
                pattern_nodes = []
                for i, pattern in enumerate(patterns):
                    pattern_name = f"Pattern {i+1}"
                    pattern_node = TopologicalNode(
                        name=pattern_name,
                        node_type="eigenpattern",
                        properties={"pattern": [self.nodes[node_id].name for node_id in pattern]},
                        symbol="⦿"
                    )
                    pattern_node_id = self.add_node(pattern_node)
                    pattern_nodes.append(pattern_node_id)
                    results["affected_nodes"].append(pattern_node_id)
                
                results["success"] = True
                results["message"] = f"Extracted {len(pattern_nodes)} patterns"
                results["patterns"] = patterns
            
            else:
                results["success"] = False
                results["message"] = f"Unknown transformation type: {transformation_type}"
        
        except Exception as e:
            results["success"] = False
            results["message"] = f"Error applying transformation: {str(e)}"
        
        return results
    
    def _is_subsequence(self, pattern: List[str], sequence: List[str]) -> bool:
        """Check if pattern is a subsequence of sequence"""
        i, j = 0, 0
        while i < len(pattern) and j < len(sequence):
            if pattern[i] == sequence[j]:
                i += 1
            j += 1
        return i == len(pattern)