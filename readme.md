# co-http-proxy
an http proxy midware for koa2

**Warning** use this midware after use bodyparse and session

适用于koa2的代理中间件

**警告** 请在加载bodyparse与session中间件后再加载本中间键

### usage

```js
var proxy = require(`${co-http-proxy}`);
//var bodyParser = require('koa-bodyparser');
//var session = require('koa-session');
app.use(bodyParse.json())
    .use(session())
    .use(proxy({
    	target: 'http://www.baidu.com',
    	onReq:(httpOption, ctx) => Promise.resolve(),
    	onRes:(data, ctx) => Promise.resolve(),
    	onErr: (err, ctx, next) => console.log(err),
    	apiProxyPath: ['/api/v1', '/api/v2', '/public']
    }))
```

### option

|property|type|todo|necessary|
|:--|:----|:----|:---|
|target|String|代理目标地址|Y
|apiProxyPath|Array|指定的的代理转发路径集合|Y
|onReq|Function|代理转发的前置函数（代理请求前钩子）|N
|onRes|Function|代理转发的后置函数（代理响应后钩子）|N
|onErr|Function|代理转发的错误函数（代理报错时钩子）|N

### option.onReq

代理转发的前置函数（代理请求前钩子），请返回Promise使中间件正确获取完成状态

|params|type|todo|
|:--|:----|:----|:---|
|httpOption|Object|发起转发请求的option，详情参考request
|ctx|Object|koa的ctx对象


### option.onRes

代理转发的后置函数（代理响应后钩子），请返回Promise使中间件正确获取完成状态

|params|type|todo|
|:--|:----|:----|:---|
|data|Object/String|代理返回的数据 如能被json解析则返回解析后的object,其他则返回string
|ctx|Object|koa的ctx对象


### option.oneErr

代理转发的错误函数（代理报错时钩子），请返回Promise使中间件正确获取完成状态

|params|type|todo|
|:--|:----|:----|:---|
|error|Error|http转发发生的错误
|ctx|Object|koa的ctx对象
|next|Function|koa的next方法，如不掉用next方法则请求会停留在代理中间件中
