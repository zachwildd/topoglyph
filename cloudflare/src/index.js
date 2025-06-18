export class MyDurableObject extends DurableObject {
    //
    // ctx - includes state specific to 
    //   the durable object including 
    //   methods for accessing storage
    //
    // env - contains any bindings you
    //   have associated with the Worker
    //   when you uploaded it
    //
    constructor(ctx, env) {
        // required, as we're 
        // extending the base class
        super(ctx, env);
    }

    // RPC method: can be called by a worker
    // to communicate with a durable object,
    // accesses the durable object's attached
    // storage, which is a private SQLite db
    // only accessible to the object, using 
    // SQL API  methods - e.g. sql.exec() 
    // returns an object representing the 
    // single row query result using one(), 
    // checks the query result has exactly one
    // https://developers.cloudflare.com/durable-objects/api/storage-api/#exec
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