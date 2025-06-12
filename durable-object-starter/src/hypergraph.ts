// CloudFlare Edge-Native Hypergraph for Cognitive Patterns
// ⬤ Single Invariant: Everything runs at the edge

// Pattern Node as Durable Object - each pattern is a persistent entity
export class PatternNode {
	private state: DurableObjectState;
	private storage: DurableObjectStorage;

	constructor(state: DurableObjectState) {
		this.state = state;
		this.storage = state.storage;
	}

	// ⬢ Universal API: CRUD operations on patterns
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const method = request.method;

		try {
			switch (method) {
				case 'GET':
					return this.getPattern();
				case 'POST':
					return this.updatePattern(await request.json());
				case 'PUT':
					return this.addRelationship(await request.json());
				case 'DELETE':
					return this.removeRelationship(await request.json());
				default:
					return new Response('Method not allowed', { status: 405 });
			}
		} catch (error) {
			return new Response(JSON.stringify({ error: (error as Error).message }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

	private async getPattern(): Promise<Response> {
		const pattern = await this.storage.get('pattern');
		const relationships = (await this.storage.get('relationships')) || [];
		const metadata = (await this.storage.get('metadata')) || {};

		return new Response(
			JSON.stringify({
				pattern,
				relationships,
				metadata,
				lastModified: new Date().toISOString(),
			}),
			{
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	private async updatePattern(update: any): Promise<Response> {
		// ⧋ CRDT-like merge for conflict-free updates
		const currentPattern = (await this.storage.get('pattern')) || {};
		const mergedPattern = this.mergePatterns(currentPattern, update);

		await this.storage.put('pattern', mergedPattern);

		// ⥰ Notify related patterns of update
		await this.propagateUpdate(mergedPattern);

		return new Response(JSON.stringify({ success: true, pattern: mergedPattern }));
	}

	private async addRelationship(relationship: any): Promise<Response> {
		const relationships = (await this.storage.get('relationships')) || [];
		relationships.push({
			...relationship,
			id: crypto.randomUUID(),
			timestamp: Date.now(),
		});

		await this.storage.put('relationships', relationships);

		// ⟑ Create bidirectional relationship
		if (relationship.targetPatternId) {
			await this.notifyRelatedPattern(relationship.targetPatternId, {
				type: 'relationship_added',
				sourcePatternId: this.state.id.toString(),
				relationship,
			});
		}

		return new Response(JSON.stringify({ success: true }));
	}

	private mergePatterns(current: any, update: any): any {
		// Simple CRDT-style merge - later timestamp wins for conflicts
		return {
			...current,
			...update,
			topology: update.topology || current.topology,
			lastModified: Date.now(),
			version: (current.version || 0) + 1,
		};
	}

	private async propagateUpdate(pattern: any): Promise<void> {
		const relationships = (await this.storage.get('relationships')) || [];

		// Notify all related patterns
		const notifications = relationships.map((rel) =>
			this.notifyRelatedPattern(rel.targetPatternId, {
				type: 'pattern_updated',
				sourcePatternId: this.state.id.toString(),
				pattern,
			})
		);

		await Promise.all(notifications);
	}

	private async notifyRelatedPattern(patternId: string, message: any): Promise<void> {
		// Use Durable Object stub to communicate with other patterns
		const id = this.state.env.PATTERN_NODE.idFromString(patternId);
		const stub = this.state.env.PATTERN_NODE.get(id);

		await stub.fetch('https://internal/notify', {
			method: 'POST',
			body: JSON.stringify(message),
		});
	}

	private async removeRelationship(relationship: any): Promise<Response> {
		const relationships = (await this.storage.get('relationships')) || [];
		const filtered = relationships.filter((r) => r.id !== relationship.id);

		await this.storage.put('relationships', filtered);

		return new Response(JSON.stringify({ success: true }));
	}
}

// Hypergraph Router - manages the overall graph structure
export class HypergraphRouter {
	private state: DurableObjectState;
	private storage: DurableObjectStorage;

	constructor(state: DurableObjectState) {
		this.state = state;
		this.storage = state.storage;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		switch (path) {
			case '/patterns':
				return this.handlePatternQuery(request);
			case '/discover':
				return this.handleDiscovery(request);
			case '/collaborate':
				return this.handleCollaboration(request);
			case '/evolve':
				return this.handleEvolution(request);
			default:
				return new Response('Not found', { status: 404 });
		}
	}

	private async handlePatternQuery(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const query = url.searchParams.get('q');
		const topoglyph = url.searchParams.get('topology');

		if (topoglyph) {
			// ⥇ Pattern matching using TopoGlyph structure
			return this.queryByTopology(topoglyph);
		} else if (query) {
			// Text-based search across pattern descriptions
			return this.queryByText(query);
		}

		// Return all patterns if no query
		return this.getAllPatterns();
	}

	private async queryByTopology(topology: string): Promise<Response> {
		// Get list of all pattern IDs
		const patternIds = (await this.storage.get('pattern_ids')) || [];

		const matches = [];

		for (const patternId of patternIds) {
			// Query each pattern Durable Object
			const id = this.state.env.PATTERN_NODE.idFromString(patternId);
			const stub = this.state.env.PATTERN_NODE.get(id);

			const response = await stub.fetch('https://internal/');
			const data = await response.json();

			// Calculate topology similarity (simplified)
			const similarity = this.calculateTopologySimilarity(topology, data.pattern.topology);

			if (similarity > 0.7) {
				matches.push({
					...data,
					similarity,
					patternId,
				});
			}
		}

		// Sort by similarity
		matches.sort((a, b) => b.similarity - a.similarity);

		return new Response(
			JSON.stringify({
				query: topology,
				matches,
				totalResults: matches.length,
			}),
			{
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	private async handleDiscovery(request: Request): Promise<Response> {
		// ⥰ Discover emergent relationships between patterns
		const patternIds = (await this.storage.get('pattern_ids')) || [];
		const discoveries = [];

		// Analyze patterns in batches to find emergent connections
		for (let i = 0; i < patternIds.length; i++) {
			for (let j = i + 1; j < patternIds.length; j++) {
				const connection = await this.analyzeConnection(patternIds[i], patternIds[j]);
				if (connection.strength > 0.8) {
					discoveries.push(connection);
				}
			}
		}

		return new Response(
			JSON.stringify({
				discoveries,
				timestamp: Date.now(),
			})
		);
	}

	private async handleCollaboration(request: Request): Promise<Response> {
		// WebSocket-like collaboration using Server-Sent Events
		const { readable, writable } = new TransformStream();
		const writer = writable.getWriter();

		// Set up real-time collaboration stream
		this.setupCollaborationStream(writer);

		return new Response(readable, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		});
	}

	private async handleEvolution(request: Request): Promise<Response> {
		const { patternId, delta } = await request.json();

		// Create evolved version of pattern
		const originalId = this.state.env.PATTERN_NODE.idFromString(patternId);
		const originalStub = this.state.env.PATTERN_NODE.get(originalId);

		const originalResponse = await originalStub.fetch('https://internal/');
		const originalData = await originalResponse.json();

		// Create new pattern with evolution
		const newPatternId = crypto.randomUUID();
		const newId = this.state.env.PATTERN_NODE.idFromString(newPatternId);
		const newStub = this.state.env.PATTERN_NODE.get(newId);

		const evolvedPattern = this.applyEvolution(originalData.pattern, delta);

		await newStub.fetch('https://internal/', {
			method: 'POST',
			body: JSON.stringify(evolvedPattern),
		});

		// Create evolution relationship
		await originalStub.fetch('https://internal/', {
			method: 'PUT',
			body: JSON.stringify({
				targetPatternId: newPatternId,
				type: 'evolution',
				delta,
			}),
		});

		return new Response(
			JSON.stringify({
				newPatternId,
				evolvedPattern,
			})
		);
	}

	private calculateTopologySimilarity(topology1: string, topology2: string): number {
		// Simplified topology comparison
		// In reality, this would parse TopoGlyph structure and compare
		const symbols1 = new Set(topology1.match(/[⬤⬡⬢⬣⟶⟷⟸⧋⊰⊱⧌⧍]/g) || []);
		const symbols2 = new Set(topology2.match(/[⬤⬡⬢⬣⟶⟷⟸⧋⊰⊱⧌⧍]/g) || []);

		const intersection = new Set([...symbols1].filter((x) => symbols2.has(x)));
		const union = new Set([...symbols1, ...symbols2]);

		return intersection.size / union.size;
	}

	private async analyzeConnection(patternId1: string, patternId2: string): Promise<any> {
		// Fetch both patterns and analyze for connections
		const [pattern1, pattern2] = await Promise.all([this.getPatternData(patternId1), this.getPatternData(patternId2)]);

		// Analyze domain overlap, structural similarity, etc.
		const domainSimilarity = this.calculateDomainSimilarity(pattern1, pattern2);
		const structuralSimilarity = this.calculateTopologySimilarity(pattern1.topology, pattern2.topology);

		return {
			pattern1: patternId1,
			pattern2: patternId2,
			strength: Math.max(domainSimilarity, structuralSimilarity),
			type: domainSimilarity > structuralSimilarity ? 'domain_connection' : 'structural_similarity',
		};
	}

	private async getPatternData(patternId: string): Promise<any> {
		const id = this.state.env.PATTERN_NODE.idFromString(patternId);
		const stub = this.state.env.PATTERN_NODE.get(id);
		const response = await stub.fetch('https://internal/');
		return response.json();
	}

	private calculateDomainSimilarity(pattern1: any, pattern2: any): number {
		// Simple domain similarity based on description keywords
		const words1 = new Set(pattern1.description?.toLowerCase().split(/\s+/) || []);
		const words2 = new Set(pattern2.description?.toLowerCase().split(/\s+/) || []);

		const intersection = new Set([...words1].filter((x) => words2.has(x)));
		const union = new Set([...words1, ...words2]);

		return intersection.size / union.size;
	}

	private applyEvolution(pattern: any, delta: any): any {
		return {
			...pattern,
			topology: delta.topology || pattern.topology,
			description: delta.description || pattern.description,
			examples: [...(pattern.examples || []), ...(delta.newExamples || [])],
			evolutionHistory: [
				...(pattern.evolutionHistory || []),
				{
					timestamp: Date.now(),
					delta,
				},
			],
		};
	}

	private async setupCollaborationStream(writer: WritableStreamDefaultWriter): Promise<void> {
		// Send periodic updates about pattern changes
		const interval = setInterval(async () => {
			const recentChanges = await this.getRecentChanges();
			await writer.write(`data: ${JSON.stringify(recentChanges)}\n\n`);
		}, 1000);

		// Clean up after 30 minutes
		setTimeout(() => {
			clearInterval(interval);
			writer.close();
		}, 30 * 60 * 1000);
	}

	private async getRecentChanges(): Promise<any> {
		const changes = (await this.storage.get('recent_changes')) || [];
		return changes.filter((change) => Date.now() - change.timestamp < 60000); // Last minute
	}

	private async getAllPatterns(): Promise<Response> {
		const patternIds = (await this.storage.get('pattern_ids')) || [];
		const patterns = [];

		for (const patternId of patternIds.slice(0, 50)) {
			// Limit for performance
			const data = await this.getPatternData(patternId);
			patterns.push({ ...data, id: patternId });
		}

		return new Response(
			JSON.stringify({
				patterns,
				total: patternIds.length,
			})
		);
	}
}

// Main Worker - routes requests to appropriate Durable Objects
export default {
	async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Enable CORS for frontend
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			if (url.pathname.startsWith('/pattern/')) {
				// Route to specific pattern Durable Object
				const patternId = url.pathname.split('/')[2];
				const id = env.PATTERN_NODE.idFromString(patternId);
				const stub = env.PATTERN_NODE.get(id);
				const response = await stub.fetch(request);

				// Add CORS headers to response
				const newResponse = new Response(response.body, {
					status: response.status,
					headers: { ...Object.fromEntries(response.headers), ...corsHeaders },
				});

				return newResponse;
			} else {
				// Route to hypergraph router
				const id = env.HYPERGRAPH_ROUTER.idFromString('main');
				const stub = env.HYPERGRAPH_ROUTER.get(id);
				const response = await stub.fetch(request);

				const newResponse = new Response(response.body, {
					status: response.status,
					headers: { ...Object.fromEntries(response.headers), ...corsHeaders },
				});

				return newResponse;
			}
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: error.message,
					stack: error.stack,
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				}
			);
		}
	},
};

// Environment bindings needed in wrangler.toml:
// [durable_objects]
// bindings = [
//   { name = "PATTERN_NODE", class_name = "PatternNode" },
//   { name = "HYPERGRAPH_ROUTER", class_name = "HypergraphRouter" }
// ]
