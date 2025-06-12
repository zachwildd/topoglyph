// TODO:
// [] how to load context, modules, ensure LLMs extend TopoGlyph effectively
// [] what is the interface for chatting going to look like? (mode & domain affordances?)
// [] what does the gallery for exploring past conversational artifacts and model versions look like?
// [] where is the system prompt persisted
// [] where is the data created being persisted
// [] from where and how is this data being accessed?

interface Env {
	OPENROUTER_API_KEY: string;
	R2_BUCKET_URL: string;
}

async function saveConversation(conversation: unknown): Promise<void> {
	// write the conversation to an r2 bucket
	//
}

async function streamResponseFromOpenRouter(message: string): Promise<string> {
	//
	return '';
}

async function getResponseFromOpenRouter(message: string, model: string, env: Env): Promise<string> {
	const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
			// 'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
			// 'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model,
			messages: [
				{
					role: 'user',
					content: 'What is the meaning of life?',
				},
			],
		}),
	});
	return response.json();
}

function generateId(): string {
	return '123';
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// enable cors
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS')
			return new Response(null, {
				headers: corsHeaders,
			});

		if (request.method !== 'POST')
			return new Response('Proxy - POST only', {
				status: 405,
				headers: { 'Content-Type': 'text/plain', ...corsHeaders },
			});

		try {
			// 1. parse request
			const body = await request.json();
			console.log('body', body);

			// 2. is this an existing
			// 	  conversation?
			if (body.conversationId) {
				console.log('conversation already');
			} else {
				console.log('no conversation');
			}

			// 2. make request upstream
			// 	  to Open Router
			// 	  wait for response
			const response = await getResponseFromOpenRouter(body.message, 'openai/gpt-4o', env);
			console.log('response', response);

			// 3. store responses in r2
			//	  intentionally public
			// 	  store in R2 bucket (async, don't wait)
			const conversationId = generateId();
			// env.R2_BUCKET_URL.put(`conversations/${conversationId}.json`, JSON.stringify(conversation, null, 2), {
			// 	httpMetadata: {
			// 		contentType: 'application/json',
			// 		cacheControl: 'public, max-age=31536000', // Cache for 1 year
			// 	},
			// });

			// 4. return response with conversation id
			return Response.json(
				{
					conversationId,
					response,
					publicUrl: `https://your-bucket.r2.dev/conversations/${conversationId}.json`,
				},
				{ headers: corsHeaders }
			);
		} catch (error) {
			if (error instanceof Error)
				return Response.json(
					{
						error: 'Proxy failed',
						details: error.message,
					},
					{
						status: 500,
						headers: corsHeaders,
					}
				);
			else
				return Response.json(
					{
						error: 'idk',
						details: 'see above',
					},
					{
						status: 500,
						headers: corsHeaders,
					}
				);
		}
	},
};
