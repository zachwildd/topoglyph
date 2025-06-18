// server.js - Express REST API for CogniBloom

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
const CogniBloomGraph = require('./cognibloomGraph');

// Configuration
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'cognibloom';

// Initialize database
const graphDB = new CogniBloomGraph(MONGO_URI, DB_NAME);

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Authentication middleware (simplified for demo)
const authenticateUser = (req, res, next) => {
  // In a real app, this would validate a JWT token or session
  // For demo purposes, we'll use a header
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.user = { id: userId };
  next();
};

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await graphDB.connect();
    res.json({ status: 'ok', message: 'Connected to database' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Module endpoints
app.get('/modules', async (req, res) => {
  try {
    await graphDB.connect();
    
    const category = req.query.category;
    const search = req.query.search;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const modules = await graphDB.nodes.find(query).toArray();
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/modules/:id', async (req, res) => {
  try {
    const module = await graphDB.getNodeById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    res.json(module);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/modules', authenticateUser, async (req, res) => {
  try {
    const moduleData = {
      ...req.body,
      type: 'module',
      metadata: {
        createdBy: req.user.id
      }
    };
    
    const newModule = await graphDB.createNode(moduleData);
    res.status(201).json(newModule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/modules/:id', authenticateUser, async (req, res) => {
  try {
    const module = await graphDB.getNodeById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    // Check ownership (in a real app, you'd also check admin status)
    if (module.metadata.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this module' });
    }
    
    const updatedModule = await graphDB.updateNode(req.params.id, req.body);
    res.json(updatedModule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/modules/:id', authenticateUser, async (req, res) => {
  try {
    const module = await graphDB.getNodeById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    // Check ownership (in a real app, you'd also check admin status)
    if (module.metadata.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this module' });
    }
    
    const deleted = await graphDB.deleteNode(req.params.id);
    
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: 'Failed to delete module' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connection endpoints
app.post('/connections', authenticateUser, async (req, res) => {
  try {
    const { sourceId, targetId, ...connectionData } = req.body;
    
    if (!sourceId || !targetId) {
      return res.status(400).json({ error: 'Source and target IDs are required' });
    }
    
    // Verify nodes exist
    const sourceNode = await graphDB.getNodeById(sourceId);
    const targetNode = await graphDB.getNodeById(targetId);
    
    if (!sourceNode || !targetNode) {
      return res.status(404).json({ error: 'Source or target module not found' });
    }
    
    connectionData.metadata = {
      createdBy: req.user.id
    };
    
    const newConnection = await graphDB.createEdge(sourceId, targetId, connectionData);
    res.status(201).json(newConnection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/connections/:id', authenticateUser, async (req, res) => {
  try {
    const connection = await graphDB.getEdgeById(req.params.id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    // Check ownership
    if (connection.metadata.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this connection' });
    }
    
    const updatedConnection = await graphDB.updateEdge(req.params.id, req.body);
    res.json(updatedConnection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/connections/:id', authenticateUser, async (req, res) => {
  try {
    const connection = await graphDB.getEdgeById(req.params.id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    // Check ownership
    if (connection.metadata.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this connection' });
    }
    
    const deleted = await graphDB.deleteEdge(req.params.id);
    
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: 'Failed to delete connection' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Architecture endpoints
app.get('/architectures', async (req, res) => {
  try {
    const userId = req.query.userId;
    const isPublic = req.query.public === 'true';
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    
    let architectures;
    
    if (userId) {
      architectures = await graphDB.findUserArchitectures(userId, limit, skip);
    } else if (isPublic) {
      architectures = await graphDB.findPublicArchitectures(limit, skip);
    } else {
      return res.status(400).json({ 
        error: 'Must specify userId or public=true parameter' 
      });
    }
    
    res.json(architectures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/architectures/:id', async (req, res) => {
  try {
    const architecture = await graphDB.getArchitectureById(req.params.id);
    
    if (!architecture) {
      return res.status(404).json({ error: 'Architecture not found' });
    }
    
    res.json(architecture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/architectures', authenticateUser, async (req, res) => {
  try {
    const { name, description, nodeIds, edgeIds } = req.body;
    
    if (!name || !Array.isArray(nodeIds) || !Array.isArray(edgeIds)) {
      return res.status(400).json({ 
        error: 'Name, nodeIds array, and edgeIds array are required' 
      });
    }
    
    const architecture = await graphDB.createArchitecture(
      name, 
      description, 
      nodeIds, 
      edgeIds, 
      req.user
    );
    
    res.status(201).json(architecture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/architectures/:id', authenticateUser, async (req, res) => {
  try {
    const architecture = await graphDB.getArchitectureById(req.params.id);
    
    if (!architecture) {
      return res.status(404).json({ error: 'Architecture not found' });
    }
    
    // Check ownership
    if (architecture.metadata.createdBy !== req.user.id) {
      return res.status(403).json({ 
        error: 'Not authorized to modify this architecture' 
      });
    }
    
    const updatedArchitecture = await graphDB.updateArchitecture(
      req.params.id, 
      req.body
    );
    
    res.json(updatedArchitecture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/architectures/:id', authenticateUser, async (req, res) => {
  try {
    const architecture = await graphDB.getArchitectureById(req.params.id);
    
    if (!architecture) {
      return res.status(404).json({ error: 'Architecture not found' });
    }
    
    // Check ownership
    if (architecture.metadata.createdBy !== req.user.id) {
      return res.status(403).json({ 
        error: 'Not authorized to delete this architecture' 
      });
    }
    
    const deleted = await graphDB.deleteArchitecture(req.params.id);
    
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: 'Failed to delete architecture' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Graph operations endpoints
app.get('/modules/:id/neighbors', async (req, res) => {
  try {
    const nodeId = req.params.id;
    const neighbors = await graphDB.getNeighbors(nodeId);
    
    res.json(neighbors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/subgraph', async (req, res) => {
  try {
    const { nodeIds, maxDepth } = req.body;
    
    if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
      return res.status(400).json({ error: 'Array of nodeIds is required' });
    }
    
    const depth = maxDepth || 2;
    const subgraph = await graphDB.getSubgraph(nodeIds, depth);
    
    res.json(subgraph);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search endpoint
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    const type = req.query.type || 'all';
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    let results = {};
    
    if (type === 'all' || type === 'modules') {
      results.modules = await graphDB.searchModules(query);
    }
    
    if (type === 'all' || type === 'architectures') {
      results.architectures = await graphDB.searchArchitectures(query);
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoints
app.get('/analytics/module-usage', async (req, res) => {
  try {
    const stats = await graphDB.getModuleUsageStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`CogniBloom API running on port ${PORT}`);
});

module.exports = app; // For testing