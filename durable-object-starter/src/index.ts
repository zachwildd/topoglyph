import { DurableObject } from 'cloudflare:workers';

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject<Env> {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param name - The name provided to a Durable Object instance from a Worker
	 * @returns The greeting to be sent back to the Worker
	 */
	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}
}

// ===== MODEL ROUTING =====

async function callModel(apiKey: string, prompt: string, mode: string): Promise<string> {
	// instead of this really simple shit
	// we should actually do something intresting
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
	//
	const prompt = ``;

	// 2. Build context-aware prompt:
	// TODO: should include the relavant TopoGlyph documents no?
	const context = '';
	// relevantNodes.length > 0
	// 	? `\nRelevant patterns:\n${relevantNodes
	// 			.map((n) => `${n.content.symbol || n.type}: ${n.content.description || 'pattern'}`)
	// 			.join('\n')}`
	// 	: '';

	// 3. Get model response
	const response = await callModel(apiKey, prompt, mode);

	// TODO: future feature, not needed yet
	// 4. Extract and store new cognitive nodes
	// const newSymbols = extractTopoGlyphSymbols(response);
	// const newNodeIds: string[] = [];
	// for (const symbol of newSymbols) {
	// 	// Don't duplicate existing symbols
	// 	const existing = await findNodes(kv, symbol);
	// 	if (existing.length === 0) {
	// 		const nodeId = await storeNode(kv, {
	// 			type: 'symbol',
	// 			content: {
	// 				symbol,
	// 				context: query,
	// 				response: response.slice(0, 200), // Truncated context
	// 			},
	// 			edges: [],
	// 			created: Date.now(),
	// 		});
	// 		newNodeIds.push(nodeId);
	// 	}
	// }

	// TODO: future feature, same as above
	// 5. Store the complete interaction as a pattern
	// if (response.includes('⦗') && response.includes('⦘')) {
	// 	const patternId = await storeNode(kv, {
	// 		type: 'pattern',
	// 		content: {
	// 			query,
	// 			response,
	// 			mode,
	// 			symbols: newSymbols,
	// 			description: `${mode} pattern for: ${query.slice(0, 50)}...`,
	// 		},
	// 		edges: newNodeIds.map((id) => ({ to: id, relation: 'contains', weight: 1.0 })),
	// 		created: Date.now(),
	// 	});
	// 	newNodeIds.push(patternId);
	// }

	return { response, newNodes: [], relevantPatterns: [], mode };
}

// ===== WORKER MAIN =====

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
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
  {"query": "How does consciousness emerge?", "mode": "integration"}`,
						{ headers: { ...corsHeaders, 'Content-Type': 'text/plain' } }
					);
			}
		} catch (error) {
			if (error instanceof Error !== true) {
				return Response.json(
					{
						error: 'Processing failed',
						details: 'Unexpected error: contact service administrator for support.',
					},
					{ status: 500, headers: corsHeaders }
				);
			}
		}

		// Create a `DurableObjectId` for an instance of the `MyDurableObject`
		// class named "foo". Requests from all Workers to the instance named
		// "foo" will go to a single globally unique Durable Object instance.
		const id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName('foo');

		// Create a stub to open a communication channel with the Durable
		// Object instance.
		const stub = env.MY_DURABLE_OBJECT.get(id);

		// Call the `sayHello()` RPC method on the stub to invoke the method on
		// the remote Durable Object instance
		const greeting = await stub.sayHello('world');

		return new Response(greeting);
	},
} satisfies ExportedHandler<Env>;
