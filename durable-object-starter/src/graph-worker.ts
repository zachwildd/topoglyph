/**
 * Minimal CloudFlare TopoGlyph Implementation
 * Single Worker + KV Store + OpenRouter = Complete Cognitive Graph System
 *
 * Deploy: `wrangler deploy`
 * Use: POST to /process with {"query": "your question", "mode": "integration"}
 */

interface Env {
	TOPOGLYPH_KV: KVNamespace;
	OPENROUTER_API_KEY: string;
}

// ===== CORE TYPES =====

interface GraphNode {
	id: string;
	type: 'symbol' | 'operation' | 'pattern' | 'expression';
	content: any;
	edges: Array<{ to: string; relation: string; weight: number }>;
	created: number;
}

// ===== UTILITIES =====

async function hash(data: string): Promise<string> {
	const encoder = new TextEncoder();
	const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
	const array = Array.from(new Uint8Array(buffer));
	return array
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
		.slice(0, 12);
}

function extractTopoGlyphSymbols(text: string): string[] {
	const symbols = text.match(/[■□▣▨●◐◯⊕⊖⟳]/g) || [];
	return [...new Set(symbols)];
}

// ===== GRAPH OPERATIONS =====

async function storeNode(kv: KVNamespace, node: Omit<GraphNode, 'id'>): Promise<string> {
	const id = await hash(JSON.stringify(node));
	const fullNode = { ...node, id };

	await kv.put(`node:${id}`, JSON.stringify(fullNode));

	// Simple indexing
	if (node.type === 'symbol' && node.content.symbol) {
		const existing = ((await kv.get(`idx:${node.content.symbol}`, 'json')) as string[]) || [];
		existing.push(id);
		await kv.put(`idx:${node.content.symbol}`, JSON.stringify(existing));
	}

	return id;
}

async function getNode(kv: KVNamespace, id: string): Promise<GraphNode | null> {
	const data = await kv.get(`node:${id}`);
	return data ? JSON.parse(data) : null;
}

async function findNodes(kv: KVNamespace, symbol: string): Promise<GraphNode[]> {
	const ids = ((await kv.get(`idx:${symbol}`, 'json')) as string[]) || [];
	const nodes = await Promise.all(ids.map((id) => getNode(kv, id)));
	return nodes.filter(Boolean) as GraphNode[];
}

// ===== MODEL ROUTING =====

async function callModel(apiKey: string, prompt: string, mode: string): Promise<string> {
	// instead of this really simple shit
	// we should
	const models = {
		creative: 'openai/gpt-4-turbo-preview',
		analysis: 'anthropic/claude-3-sonnet',
		integration: 'anthropic/claude-3-sonnet',
		reflection: 'anthropic/claude-3-opus',
	};

	const model = models[mode as keyof typeof models] || models.integration;

	const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model,
			messages: [{ role: 'user', content: prompt }],
			temperature: mode === 'creative' ? 0.9 : 0.7,
			max_tokens: 1500,
		}),
	});

	const data = await response.json();
	return data.choices[0].message.content;
}

// ===== COGNITIVE PROCESSING =====

async function processQuery(kv: KVNamespace, apiKey: string, query: string, mode: string) {
	// 1. Find relevant patterns
	const symbols = extractTopoGlyphSymbols(query);
	const relevantNodes: GraphNode[] = [];

	for (const symbol of symbols) {
		const nodes = await findNodes(kv, symbol);
		relevantNodes.push(...nodes);
	}

	// 2. Build context-aware prompt:
	// TODO: should include the relavant TopoGlyph documents no?
	const context =
		relevantNodes.length > 0
			? `\nRelevant patterns:\n${relevantNodes
					.map((n) => `${n.content.symbol || n.type}: ${n.content.description || 'pattern'}`)
					.join('\n')}`
			: '';

	//
	const prompt = `You are a TopoGlyph cognitive processor. Analyze this query using topological thinking.

Query: ${query}
Mode: ${mode}${context}

Use TopoGlyph symbols in your response:
■ = stable knowledge
□ = unknowns  
▨ = contradictions
⊕ = integration
⊖ = analysis
⟳ = recursive processing

Show your cognitive process and any new TopoGlyph patterns you discover.`;

	// 3. Get model response
	const response = await callModel(apiKey, prompt, mode);

	// 4. Extract and store new cognitive nodes
	const newSymbols = extractTopoGlyphSymbols(response);
	const newNodeIds: string[] = [];

	for (const symbol of newSymbols) {
		// Don't duplicate existing symbols
		const existing = await findNodes(kv, symbol);
		if (existing.length === 0) {
			const nodeId = await storeNode(kv, {
				type: 'symbol',
				content: {
					symbol,
					context: query,
					response: response.slice(0, 200), // Truncated context
				},
				edges: [],
				created: Date.now(),
			});
			newNodeIds.push(nodeId);
		}
	}

	// 5. Store the complete interaction as a pattern
	if (response.includes('⦗') && response.includes('⦘')) {
		const patternId = await storeNode(kv, {
			type: 'pattern',
			content: {
				query,
				response,
				mode,
				symbols: newSymbols,
				description: `${mode} pattern for: ${query.slice(0, 50)}...`,
			},
			edges: newNodeIds.map((id) => ({ to: id, relation: 'contains', weight: 1.0 })),
			created: Date.now(),
		});
		newNodeIds.push(patternId);
	}

	return {
		response,
		newNodes: newNodeIds,
		relevantPatterns: relevantNodes.map((n) => n.id),
		mode,
	};
}

// ===== WORKER MAIN =====

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Content-Type': 'application/json',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);

		try {
			switch (url.pathname) {
				case '/':
					return new Response(
						`
TopoGlyph Cognitive Graph Engine

Endpoints:
  POST /process - Process cognitive queries
  GET /graph - Query graph nodes  
  GET /stats - Get system statistics

Example:
  POST /process
  {"query": "How does consciousness emerge?", "mode": "integration"}
          `,
						{ headers: { 'Content-Type': 'text/plain', ...corsHeaders } }
					);

				case '/process':
					if (request.method !== 'POST') {
						return new Response('Method not allowed', { status: 405 });
					}

					const { query, mode = 'integration' } = await request.json();

					if (!query) {
						return Response.json({ error: 'Query required' }, { status: 400, headers: corsHeaders });
					}

					const result = await processQuery(env.TOPOGLYPH_KV, env.OPENROUTER_API_KEY, query, mode);

					return Response.json(
						{
							success: true,
							...result,
							timestamp: Date.now(),
						},
						{ headers: corsHeaders }
					);

				case '/graph':
					const nodeId = url.searchParams.get('id');
					const symbol = url.searchParams.get('symbol');

					if (nodeId) {
						const node = await getNode(env.TOPOGLYPH_KV, nodeId);
						return Response.json({ node }, { headers: corsHeaders });
					}

					if (symbol) {
						const nodes = await findNodes(env.TOPOGLYPH_KV, symbol);
						return Response.json({ nodes: nodes.slice(0, 10) }, { headers: corsHeaders });
					}

					return Response.json({ error: 'Specify ?id=xxx or ?symbol=xxx' }, { status: 400, headers: corsHeaders });

				case '/stats':
					// Simple stats
					const { keys } = await env.TOPOGLYPH_KV.list({ prefix: 'node:' });
					const nodeCount = keys.length;

					return Response.json(
						{
							totalNodes: nodeCount,
							timestamp: Date.now(),
							status: 'active',
						},
						{ headers: corsHeaders }
					);

				default:
					return new Response('Not found', { status: 404 });
			}
		} catch (error) {
			return Response.json(
				{
					error: 'Processing failed',
					details: error.message,
				},
				{ status: 500, headers: corsHeaders }
			);
		}
	},
};
