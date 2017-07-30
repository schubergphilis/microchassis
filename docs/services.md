
# Services

These are the implementations of the GRPC services as defined in the proto. 

## Naming convention

Service classes should have the exact name as defined in the proto, you are allowed to add ``` Service ``` to the end, this will be split off when passing the services to the GRPC server.

### Example 

```javascript
import { injectable } from 'inversify';

import { HttpMethod, Context, Service, ServiceCallback } from './../../src';
import { HelloRequest } from './../proto/hello';
import { HelloManager } from './../managers';

@injectable()
export class HelloService implements Service {
  public url = '/hello';

  constructor(private manager: HelloManager) {}

  handler(context: Context, request: HelloRequest, callback: ServiceCallback) {
    callback(null, {
      message: this.manager.hello(request.name)
    });
  }
}
```

### REST options

#### service.method (optional, defaults to GET)

The http method of the services defaults to GET. To pass a different method:

```javascript
import { HttpMethod } from 'rmicroservice';

class MyService implements Service {
  method: HttpMethod.POST;
}
```

#### service.url (required)

The url of the rest endpoint, for routing options see: [express](https://expressjs.com/en/guide/routing.html).

```javascript
import { HttpMethod } from 'rmicroservice';

class MyService implements Service {
  url: '/foo/:bar';
}
```

#### service.queryMapping (optional)

This can be used to map query string parameters to the request object. Imagine you have an request object like:

```javascript
  {
    content: {
      foo: undefined
      bar: {
        foo: undefined
      }
    }
  }
```

When you configure your queryMapping like this the values ```content.foo``` and ```content.bar.foo``` will be set with the querystring parameters. Resulting in your handler being called with these values filled in into the request object.

```javascript
import { HttpMethod } from 'rmicroservice';

class MyService implements Service {
  queryMapping: {
    'foo': 'content.foo',
    'bar': 'content.foo.bar'
  };
}
```

#### service.urlMapping (optional)

Just like query string paramters you can use this to map parameters in the url:

```javascript
import { HttpMethod } from 'rmicroservice';

class MyService implements Service {
  url: '/foo/:bar';
  urlMapping: {
    'bar': 'somekey.foo'
  };
}
```

