var Koa = require('koa'),
    redisStore = require('koa-redis'),
    session = require('koa-session-minimal'),
    bodyParser = require('koa-bodyparser'),
    proxy = require('../index'),
    app = new Koa();
var initMidware = function(app) {
    var redisStoreOption = {
        host: '127.0.0.1',
        port: 6379,
        db: 2
    };
    var sessionOption = {
        store: redisStore(redisStoreOption),
        key: 'handsomegh',
        cookie: {
            maxAge: 24 * 60 * 60 * 1000
        }
    };
    app.use(bodyParser());
    app.use(session(sessionOption));
    app.use(proxy({
        target: 'http://127.0.0.1:3004',
        onReq: (httpOption, ctx) => Promise.resolve(),
        onRes: (data, ctx) => Promise.resolve(),
        onErr: (err, ctx, next) => console.log(err),
        apiProxyPath: ['/api/v1', '/api/v2', '/public']
    }));
    console.log('init midware success');
    return Promise.resolve();
};
var initServer = async function(app) {
    try {
        await initMidware(app);
        app.listen(3001);
        console.log('server is running on 3001')
    } catch (err) {
        console.log(err)
    }
};
initServer(app)
