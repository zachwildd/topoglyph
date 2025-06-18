// cognibloomGraph.js - A lightweight graph operations wrapper for MongoDB

const { MongoClient, ObjectId } = require('mongodb');

class CogniBloomGraph {
  constructor(dbUrl, dbName) {
    this.dbUrl = dbUrl;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
    this.nodes = null;
    this.edges = null;
    this.architectures = null;
  }

  // Connect to the database
  async connect() {
    if (this.client) return this.db;
    
    this.client = new MongoClient(this.dbUrl);
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    
    // Get collection references
    this.nodes = this.db.collection('nodes');
    this.edges = this.db.collection('edges');
    this.architectures = this.db.collection('architectures');
    
    // Ensure indexes for performance
    await this.nodes.createIndex({ type: 1, category: 1 });
    await this.edges.createIndex({ sourceId: 1, targetId: 1 });
    await this.edges.createIndex({ targetId: 1 });
    await this.architectures.createIndex({ name: 1 });
    await this.architectures.createIndex({ 'metadata.createdBy': 1 });
    
    return this.db;
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  // Node Operations
  async createNode(nodeData) {
    await this.connect();
    const now = new Date();
    const node = {
      ...nodeData,
      metadata: {
        ...nodeData.metadata,
        created: now,
        lastModified: now
      }
    };
    
    const result = await this.nodes.insertOne(node);
    return { ...node, _id: result.insertedId };
  }

  async getNodeById(nodeId) {
    await this.connect();
    return this.nodes.findOne({ _id: new ObjectId(nodeId) });
  }

  async updateNode(nodeId, updates) {
    await this.connect();
    const now = new Date();
    const updateData = {
      ...updates,
      'metadata.lastModified': now
    };
    
    await this.nodes.updateOne(
      { _id: new ObjectId(nodeId) },
      { $set: updateData }
    );
    
    return this.getNodeById(nodeId);
  }

  async deleteNode(nodeId) {
    await this.connect();
    
    // First, delete all edges connected to this node
    await this.edges.deleteMany({
      $or: [
        { sourceId: new ObjectId(nodeId) },
        { targetId: new ObjectId(nodeId) }
      ]
    });
    
    // Then delete the node
    const result = await this.nodes.deleteOne({ _id: new ObjectId(nodeId) });
    return result.deletedCount === 1;
  }

  // Edge Operations
  async createEdge(sourceId, targetId, edgeData) {
    await this.connect();
    const now = new Date();
    const edge = {
      sourceId: new ObjectId(sourceId),
      targetId: new ObjectId(targetId),
      ...edgeData,
      metadata: {
        ...edgeData.metadata,
        created: now,
        lastModified: now
      }
    };
    
    const result = await this.edges.insertOne(edge);
    return { ...edge, _id: result.insertedId };
  }

  async getEdgeById(edgeId) {
    await this.connect();
    return this.edges.findOne({ _id: new ObjectId(edgeId) });
  }

  async updateEdge(edgeId, updates) {
    await this.connect();
    const now = new Date();
    const updateData = {
      ...updates,
      'metadata.lastModified': now
    };
    
    await this.edges.updateOne(
      { _id: new ObjectId(edgeId) },
      { $set: updateData }
    );
    
    return this.getEdgeById(edgeId);
  }

  async deleteEdge(edgeId) {
    await this.connect();
    const result = await this.edges.deleteOne({ _id: new ObjectId(edgeId) });
    return result.deletedCount === 1;
  }

  // Graph Operations
  async getNeighbors(nodeId) {
    await this.connect();
    const objectId = new ObjectId(nodeId);
    
    // Find all outgoing edges
    const outgoingEdges = await this.edges.find({ sourceId: objectId }).toArray();
    
    // Find all incoming edges
    const incomingEdges = await this.edges.find({ targetId: objectId }).toArray();
    
    // Get unique neighbor IDs
    const neighborIds = new Set();
    outgoingEdges.forEach(edge => neighborIds.add(edge.targetId.toString()));
    incomingEdges.forEach(edge => neighborIds.add(edge.sourceId.toString()));
    
    // Get the neighbor nodes
    const neighbors = await Promise.all(
      Array.from(neighborIds).map(id => this.getNodeById(id))
    );
    
    return {
      node: await this.getNodeById(nodeId),
      outgoing: outgoingEdges,
      incoming: incomingEdges,
      neighbors
    };
  }

  async getSubgraph(startNodeIds, maxDepth = 2) {
    await this.connect();
    const visited = new Set();
    const nodeMap = new Map();
    const edgeSet = new Set();
    
    const queue = startNodeIds.map(id => ({ id, depth: 0 }));
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      const nodeId = id.toString();
      
      if (visited.has(nodeId) || depth > maxDepth) continue;
      visited.add(nodeId);
      
      // Get the node and its connections
      const { node, outgoing, incoming, neighbors } = await this.getNeighbors(nodeId);
      
      // Add the node to our map
      nodeMap.set(nodeId, node);
      
      // Add all edges to our set
      outgoing.forEach(edge => edgeSet.add(edge._id.toString()));
      incoming.forEach(edge => edgeSet.add(edge._id.toString()));
      
      // Add unvisited neighbors to the queue
      neighbors.forEach(neighbor => {
        const neighborId = neighbor._id.toString();
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, depth: depth + 1 });
        }
      });
    }
    
    // Convert sets and maps to arrays
    const nodes = Array.from(nodeMap.values());
    const edges = await Promise.all(
      Array.from(edgeSet).map(id => this.getEdgeById(id))
    );
    
    return { nodes, edges };
  }

  // Architecture Operations
  async createArchitecture(name, description, nodeIds, edgeIds, userData) {
    await this.connect();
    const now = new Date();
    
    // Generate DNA sequence and TopoGlyph representation
    // In a real implementation, these would be computed based on nodes and edges
    const dnaSequence = await this.computeDNASequence(nodeIds, edgeIds);
    const topoGlyph = await this.computeTopoGlyph(nodeIds, edgeIds);
    
    const architecture = {
      name,
      description,
      nodeIds: nodeIds.map(id => new ObjectId(id)),
      edgeIds: edgeIds.map(id => new ObjectId(id)),
      dnaSequence,
      topoGlyph,
      performance: {
        analytical: 0,
        creative: 0,
        learning: 0,
        adaptability: 0,
        metacognition: 0
      },
      metadata: {
        created: now,
        lastModified: now,
        createdBy: userData.id,
        isPublic: false
      }
    };
    
    const result = await this.architectures.insertOne(architecture);
    return { ...architecture, _id: result.insertedId };
  }

  async getArchitectureById(architectureId) {
    await this.connect();
    const architecture = await this.architectures.findOne({ 
      _id: new ObjectId(architectureId) 
    });
    
    if (!architecture) return null;
    
    // Get all nodes and edges to fully populate the architecture
    const nodes = await Promise.all(
      architecture.nodeIds.map(id => this.getNodeById(id))
    );
    
    const edges = await Promise.all(
      architecture.edgeIds.map(id => this.getEdgeById(id))
    );
    
    return {
      ...architecture,
      nodes,
      edges
    };
  }

  async updateArchitecture(architectureId, updates) {
    await this.connect();
    const now = new Date();
    
    // If nodes or edges are updated, recompute DNA and TopoGlyph
    if (updates.nodeIds || updates.edgeIds) {
      const nodeIds = updates.nodeIds || 
        (await this.getArchitectureById(architectureId)).nodeIds.map(id => id.toString());
      
      const edgeIds = updates.edgeIds || 
        (await this.getArchitectureById(architectureId)).edgeIds.map(id => id.toString());
      
      updates.dnaSequence = await this.computeDNASequence(nodeIds, edgeIds);
      updates.topoGlyph = await this.computeTopoGlyph(nodeIds, edgeIds);
      
      // Convert IDs to ObjectIds
      if (updates.nodeIds) {
        updates.nodeIds = updates.nodeIds.map(id => new ObjectId(id));
      }
      
      if (updates.edgeIds) {
        updates.edgeIds = updates.edgeIds.map(id => new ObjectId(id));
      }
    }
    
    const updateData = {
      ...updates,
      'metadata.lastModified': now
    };
    
    await this.architectures.updateOne(
      { _id: new ObjectId(architectureId) },
      { $set: updateData }
    );
    
    return this.getArchitectureById(architectureId);
  }

  async deleteArchitecture(architectureId) {
    await this.connect();
    const result = await this.architectures.deleteOne({ 
      _id: new ObjectId(architectureId) 
    });
    return result.deletedCount === 1;
  }

  async findPublicArchitectures(limit = 20, skip = 0) {
    await this.connect();
    return this.architectures.find({ 
      'metadata.isPublic': true 
    })
    .sort({ 'metadata.lastModified': -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  }

  async findUserArchitectures(userId, limit = 20, skip = 0) {
    await this.connect();
    return this.architectures.find({ 
      'metadata.createdBy': userId 
    })
    .sort({ 'metadata.lastModified': -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  }

  // Helper methods for computing architecture properties
  async computeDNASequence(nodeIds, edgeIds) {
    // In a real implementation, this would create a DNA sequence based on modules
    // For demo purposes, we'll return a placeholder
    return "ID-AS-EX-AC-DC";
  }

  async computeTopoGlyph(nodeIds, edgeIds) {
    // In a real implementation, this would generate TopoGlyph notation
    // For demo purposes, we'll return a placeholder
    return "⦗■⦘ ⊕ ⦗□⦘ → ⟦◊⟧";
  }
  
  // Advanced search capabilities
  async searchModules(query) {
    await this.connect();
    return this.nodes.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    }).toArray();
  }
  
  async searchArchitectures(query) {
    await this.connect();
    return this.architectures.find({
      $and: [
        { 'metadata.isPublic': true },
        { $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]}
      ]
    }).toArray();
  }
  
  // Analytics helpers
  async getModuleUsageStatistics() {
    await this.connect();
    const architectures = await this.architectures.find({}).toArray();
    
    // Count module usage across architectures
    const moduleUsage = {};
    
    for (const architecture of architectures) {
      for (const nodeId of architecture.nodeIds) {
        const id = nodeId.toString();
        moduleUsage[id] = (moduleUsage[id] || 0) + 1;
      }
    }
    
    // Get full module details for the most used modules
    const topModuleIds = Object.entries(moduleUsage)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 10)
      .map(([id]) => id);
    
    const topModules = await Promise.all(
      topModuleIds.map(async id => {
        const module = await this.getNodeById(id);
        return {
          ...module,
          usageCount: moduleUsage[id]
        };
      })
    );
    
    return topModules;
  }
}

module.exports = CogniBloomGraph;