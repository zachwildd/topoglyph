import { DurableObject } from "cloudflare:workers";

export class MyDurableObject extends DurableObject {
  constructor(ctx, env) {
    // Required, as we are extending the base class.
    super(ctx, env);
  }

  async sayHello() {
    let result = this.ctx.storage.sql
      .exec("SELECT 'Hello, World!' as greeting")
      .one();
    return result.greeting;
  }
}

export default {
  async fetch(request, env, ctx) {
    const id = env.MY_DURABLE_OBJECT.idFromName(new URL(request.url).pathname);

    const stub = env.MY_DURABLE_OBJECT.get(id);

    const greeting = await stub.sayHello();

    return new Response(greeting);
  },
};