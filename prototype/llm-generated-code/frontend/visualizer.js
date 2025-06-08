/**
 * TopoGlyph Visualizer - A 3D graph visualization for TopoGlyph structures
 */

// Main application class
class TopoGlyphVisualizer {
    constructor() {
        // Initialize properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;
        this.nodeObjects = {};
        this.edgeObjects = {};
        this.labelObjects = {};
        this.graph = null;
        this.selectedNode = null;
        
        // Node type to color mapping
        this.nodeColors = {
            'concept': 0x1E88E5,      // Blue
            'process': 0xE53935,      // Red
            'meta_process': 0x8E24AA, // Purple
            'contradiction': 0xFB8C00, // Orange
            'eigenpattern': 0x43A047,  // Green
            'merged_concept': 0xFFD600, // Yellow
            'default': 0xBDBDBD       // Grey
        };
        
        // Node symbol to shape mapping
        this.nodeShapes = {
            '■': 'cube',
            '□': 'cube',
            '▣': 'cube',
            '▨': 'cube',
            '▲': 'tetrahedron',
            '△': 'tetrahedron',
            '◊': 'octahedron',
            '⦿': 'sphere',
            'default': 'sphere'
        };
        
        // Edge type to color mapping
        this.edgeColors = {
            'connection': 0xAAAAAA,
            'contributes_to': 0x4CAF50,
            'triggers': 0xE91E63,
            'transforms': 0x9C27B0,
            'monitors': 0xFF9800,
            'default': 0xBDBDBD
        };
        
        // Initialize the visualization
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x121212);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.z = 15;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        // Add orbit controls
        // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.25;
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Setup raycaster for node selection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Start animation loop
        this.animate();
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Handle mouse click for node selection
        this.renderer.domElement.addEventListener('click', (event) => {
            this.handleNodeSelection(event);
        });
        
        // Setup file input for loading graphs
        document.getElementById('load-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const graphData = JSON.parse(e.target.result);
                        this.loadGraph(graphData);
                    } catch (error) {
                        console.error('Error parsing graph file:', error);
                        alert('Error loading graph: Invalid JSON format');
                    }
                };
                reader.readAsText(file);
            }
        });
        
        // Setup sample graph button
        document.getElementById('sample-btn').addEventListener('click', () => {
            this.loadSampleGraph();
        });
        
        // Setup reset camera button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetCamera();
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        // this.controls.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    handleNodeSelection(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Get all node objects for intersection testing
        const nodeObjectsArray = Object.values(this.nodeObjects);
        
        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(nodeObjectsArray);
        
        // Reset previous selection
        if (this.selectedNode) {
            const prevObject = this.nodeObjects[this.selectedNode];
            if (prevObject) {
                prevObject.material.emissive.setHex(0x000000);
                
                // Reset label
                if (this.labelObjects[this.selectedNode]) {
                    this.labelObjects[this.selectedNode].element.classList.remove('selected');
                }
            }
        }
        
        // If an intersection was found
        if (intersects.length > 0) {
            const nodeId = intersects[0].object.userData.nodeId;
            this.selectedNode = nodeId;
            
            // Highlight the selected node
            intersects[0].object.material.emissive.setHex(0x555555);
            
            // Highlight label
            if (this.labelObjects[nodeId]) {
                this.labelObjects[nodeId].element.classList.add('selected');
            }
            
            // Show node info
            this.showNodeInfo(nodeId);
        } else {
            this.selectedNode = null;
            document.getElementById('node-info').innerHTML = '';
        }
    }
    
    showNodeInfo(nodeId) {
        const node = this.graph.nodes[nodeId];
        if (!node) return;
        
        let html = `
            <h3>Node: ${node.name}</h3>
            <p><strong>Type:</strong> ${node.node_type}</p>
            <p><strong>Symbol:</strong> ${node.symbol}</p>
            <p><strong>Stability:</strong> ${node.stability.toFixed(2)}</p>
            <p><strong>Activation:</strong> ${node.activation.toFixed(2)}</p>
        `;
        
        if (Object.keys(node.properties).length > 0) {
            html += '<p><strong>Properties:</strong></p><ul>';
            for (const [key, value] of Object.entries(node.properties)) {
                html += `<li>${key}: ${JSON.stringify(value)}</li>`;
            }
            html += '</ul>';
        }
        
        // Show connected edges
        const connectedEdges = [];
        for (const edgeId in this.graph.edges) {
            const edge = this.graph.edges[edgeId];
            if (edge.source_id === nodeId || edge.target_id === nodeId) {
                connectedEdges.push(edge);
            }
        }
        
        if (connectedEdges.length > 0) {
            html += '<p><strong>Connections:</strong></p><ul>';
            for (const edge of connectedEdges) {
                const sourceName = this.graph.nodes[edge.source_id].name;
                const targetName = this.graph.nodes[edge.target_id].name;
                html += `<li>${sourceName} ${edge.symbol} ${targetName} (${edge.edge_type})</li>`;
            }
            html += '</ul>';
        }
        
        document.getElementById('node-info').innerHTML = html;
    }
    
    loadGraph(graphData) {
        // Clear existing graph
        this.clearGraph();
        
        // Store the graph data
        this.graph = graphData;
        
        // Calculate node positions using force-directed layout
        this.calculateNodePositions();
        
        // Create visual elements
        this.createNodes();
        this.createEdges();
        this.createLabels();
        
        // Reset camera
        this.resetCamera();
    }
    
    clearGraph() {
        // Remove all nodes
        for (const nodeId in this.nodeObjects) {
            this.scene.remove(this.nodeObjects[nodeId]);
        }
        
        // Remove all edges
        for (const edgeId in this.edgeObjects) {
            this.scene.remove(this.edgeObjects[edgeId]);
        }
        
        // Remove all labels
        for (const nodeId in this.labelObjects) {
            document.body.removeChild(this.labelObjects[nodeId].element);
        }
        
        // Reset collections
        this.nodeObjects = {};
        this.edgeObjects = {};
        this.labelObjects = {};
        this.selectedNode = null;
        
        // Clear node info
        document.getElementById('node-info').innerHTML = '';
    }
    
    calculateNodePositions() {
        const nodes = this.graph.nodes;
        const edges = this.graph.edges;
        
        // Initialize random positions
        for (const nodeId in nodes) {
            nodes[nodeId].position = {
                x: (Math.random() - 0.5) * 10,
                y: (Math.random() - 0.5) * 10,
                z: (Math.random() - 0.5) * 10
            };
            nodes[nodeId].velocity = { x: 0, y: 0, z: 0 };
        }
        
        // Force-directed layout simulation
        const iterations = 100;
        const repulsionForce = 1;
        const attractionForce = 0.01;
        const maxDistance = 10;
        
        for (let i = 0; i < iterations; i++) {
            // Calculate repulsion forces between all nodes
            for (const nodeId1 in nodes) {
                for (const nodeId2 in nodes) {
                    if (nodeId1 === nodeId2) continue;
                    
                    const node1 = nodes[nodeId1];
                    const node2 = nodes[nodeId2];
                    
                    const dx = node1.position.x - node2.position.x;
                    const dy = node1.position.y - node2.position.y;
                    const dz = node1.position.z - node2.position.z;
                    
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
                    
                    if (distance < maxDistance) {
                        const force = repulsionForce / (distance * distance);
                        
                        node1.velocity.x += dx * force;
                        node1.velocity.y += dy * force;
                        node1.velocity.z += dz * force;
                        
                        node2.velocity.x -= dx * force;
                        node2.velocity.y -= dy * force;
                        node2.velocity.z -= dz * force;
                    }
                }
            }
            
            // Calculate attraction forces along edges
            for (const edgeId in edges) {
                const edge = edges[edgeId];
                const sourceNode = nodes[edge.source_id];
                const targetNode = nodes[edge.target_id];
                
                if (!sourceNode || !targetNode) continue;
                
                const dx = sourceNode.position.x - targetNode.position.x;
                const dy = sourceNode.position.y - targetNode.position.y;
                const dz = sourceNode.position.z - targetNode.position.z;
                
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
                
                const force = attractionForce * distance;
                
                sourceNode.velocity.x -= dx * force;
                sourceNode.velocity.y -= dy * force;
                sourceNode.velocity.z -= dz * force;
                
                targetNode.velocity.x += dx * force;
                targetNode.velocity.y += dy * force;
                targetNode.velocity.z += dz * force;
            }
            
            // Update positions
            for (const nodeId in nodes) {
                const node = nodes[nodeId];
                
                // Add velocity to position
                node.position.x += node.velocity.x;
                node.position.y += node.velocity.y;
                node.position.z += node.velocity.z;
                
                // Dampen velocity
                node.velocity.x *= 0.9;
                node.velocity.y *= 0.9;
                node.velocity.z *= 0.9;
            }
        }
    }
    
    createNodes() {
        for (const nodeId in this.graph.nodes) {
            const node = this.graph.nodes[nodeId];
            
            // Determine node color based on type
            const color = this.nodeColors[node.node_type] || this.nodeColors.default;
            
            // Determine node shape based on symbol
            const shape = this.nodeShapes[node.symbol] || this.nodeShapes.default;
            
            // Create geometry based on shape
            let geometry;
            switch (shape) {
                case 'cube':
                    geometry = new THREE.BoxGeometry(1, 1, 1);
                    break;
                case 'tetrahedron':
                    geometry = new THREE.TetrahedronGeometry(0.8);
                    break;
                case 'octahedron':
                    geometry = new THREE.OctahedronGeometry(0.8);
                    break;
                case 'sphere':
                default:
                    geometry = new THREE.SphereGeometry(0.6, 16, 16);
                    break;
            }
            
            // Create material
            const material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.3,
                roughness: 0.7
            });
            
            // Create mesh
            const nodeMesh = new THREE.Mesh(geometry, material);
            
            // Set position
            nodeMesh.position.set(
                node.position.x,
                node.position.y,
                node.position.z
            );
            
            // Store node ID in the object for raycasting
            nodeMesh.userData.nodeId = nodeId;
            
            // Add to scene
            this.scene.add(nodeMesh);
            
            // Store reference
            this.nodeObjects[nodeId] = nodeMesh;
        }
    }
    
    createEdges() {
        for (const edgeId in this.graph.edges) {
            const edge = this.graph.edges[edgeId];
            
            // Get source and target nodes
            const sourceNode = this.graph.nodes[edge.source_id];
            const targetNode = this.graph.nodes[edge.target_id];
            
            if (!sourceNode || !targetNode) continue;
            
            // Determine edge color based on type
            const color = this.edgeColors[edge.edge_type] || this.edgeColors.default;
            
            // Create line geometry
            const points = [
                new THREE.Vector3(
                    sourceNode.position.x,
                    sourceNode.position.y,
                    sourceNode.position.z
                ),
                new THREE.Vector3(
                    targetNode.position.x,
                    targetNode.position.y,
                    targetNode.position.z
                )
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            // Create line material
            const material = new THREE.LineBasicMaterial({
                color: color,
                linewidth: 1
            });
            
            // Create line
            const line = new THREE.Line(geometry, material);
            
            // Add to scene
            this.scene.add(line);
            
            // Store reference
            this.edgeObjects[edgeId] = line;
        }
    }
    
    createLabels() {
        // Use HTML elements for labels
        for (const nodeId in this.graph.nodes) {
            const node = this.graph.nodes[nodeId];
            
            // Create HTML element
            const labelElement = document.createElement('div');
            labelElement.className = 'node-label';
            labelElement.textContent = node.name;
            labelElement.style.position = 'absolute';
            labelElement.style.top = '0px';
            labelElement.style.left = '0px';
            labelElement.style.pointerEvents = 'none';
            labelElement.style.textShadow = '1px 1px 1px rgba(0,0,0,0.5)';
            document.body.appendChild(labelElement);
            
            // Store reference
            this.labelObjects[nodeId] = {
                element: labelElement,
                position: new THREE.Vector3(
                    node.position.x,
                    node.position.y,
                    node.position.z
                )
            };
        }
        
        // Update label positions in animation loop
        const updateLabelPositions = () => {
            for (const nodeId in this.labelObjects) {
                const labelData = this.labelObjects[nodeId];
                const nodeMesh = this.nodeObjects[nodeId];
                
                if (nodeMesh) {
                    // Convert 3D position to screen position
                    const position = nodeMesh.position.clone();
                    position.project(this.camera);
                    
                    // Convert to CSS coordinates
                    const x = (position.x * 0.5 + 0.5) * window.innerWidth;
                    const y = (1 - (position.y * 0.5 + 0.5)) * window.innerHeight;
                    
                    // Update label position
                    labelData.element.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
                    
                    // Hide labels that are behind the camera
                    if (position.z > 1) {
                        labelData.element.style.display = 'none';
                    } else {
                        labelData.element.style.display = 'block';
                    }
                }
            }
            
            requestAnimationFrame(updateLabelPositions);
        };
        
        updateLabelPositions();
    }
    
    resetCamera() {
        // Reset camera position
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);
        // this.controls.reset();
    }
    
    loadSampleGraph() {
        // Create a sample graph
        const sampleGraph = {
            name: "Sample TopoGlyph Graph",
            nodes: {
                "node1": {
                    id: "node1",
                    name: "Quantum Information",
                    node_type: "concept",
                    properties: {},
                    symbol: "■",
                    stability: 1.0,
                    activation: 0.0
                },
                "node2": {
                    id: "node2",
                    name: "Topological States",
                    node_type: "concept",
                    properties: {},
                    symbol: "■",
                    stability: 1.0,
                    activation: 0.0
                },
                "node3": {
                    id: "node3",
                    name: "Critical Transitions",
                    node_type: "process",
                    properties: {},
                    symbol: "▲",
                    stability: 0.8,
                    activation: 0.5
                },
                "node4": {
                    id: "node4",
                    name: "Information Paradox",
                    node_type: "contradiction",
                    properties: {},
                    symbol: "▨",
                    stability: 0.4,
                    activation: 0.7
                },
                "node5": {
                    id: "node5",
                    name: "Meta Processing",
                    node_type: "meta_process",
                    properties: {},
                    symbol: "◊",
                    stability: 0.9,
                    activation: 0.3
                }
            },
            edges: {
                "edge1": {
                    id: "edge1",
                    source_id: "node1",
                    target_id: "node4",
                    edge_type: "contributes_to",
                    properties: {},
                    symbol: "→",
                    strength: 0.8
                },
                "edge2": {
                    id: "edge2",
                    source_id: "node2",
                    target_id: "node4",
                    edge_type: "contributes_to",
                    properties: {},
                    symbol: "→",
                    strength: 0.8
                },
                "edge3": {
                    id: "edge3",
                    source_id: "node4",
                    target_id: "node3",
                    edge_type: "triggers",
                    properties: {},
                    symbol: "⟿",
                    strength: 0.9
                },
                "edge4": {
                    id: "edge4",
                    source_id: "node5",
                    target_id: "node3",
                    edge_type: "monitors",
                    properties: {},
                    symbol: "⥁",
                    strength: 0.7
                },
                "edge5": {
                    id: "edge5",
                    source_id: "node3",
                    target_id: "node1",
                    edge_type: "transforms",
                    properties: {},
                    symbol: "≫",
                    strength: 0.6
                }
            },
            metadata: {
                version: "1.0",
                description: "Sample TopoGlyph graph for visualization testing"
            }
        };
        
        this.loadGraph(sampleGraph);
    }
}

// Initialize the visualizer when the page loads
window.addEventListener('load', () => {
    const visualizer = new TopoGlyphVisualizer();
    console.log(visualizer)
});