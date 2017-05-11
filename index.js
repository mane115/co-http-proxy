// var rp = require('request-promise');
var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var parseJSON = function(string) {
    try {
        string = JSON.parse(string);
    } catch (err) {} finally {
        return string;
    }
};
/**
 * @todo 返回中间件 － 代理制定路径（配置中的apiProxyPath）到制定的目标服务器（配置中的target）
 * @author gh
 * @param {Object} option
 * @param {String} option.target 代理目标地址
 * @param {Array} option.apiProxyPath 制定的的代理转发路径集合
 * @param {Function} option.onReq 代理转发的前置函数（代理请求前钩子） !必须使用Promise
 * @param {Function} option.onRes 代理转发的后置函数（代理响应后钩子） !必须使用Promise
 * @param {Function} option.onErr 代理转发的错误函数（代理报错时钩子）
 * @return {Function} midware 返回代理中间件
 * @inner
 *  1.必须在此中间件前使用session，以此兼容session-cookie模式的网站
 *  2.必须在此中间件前使用bodyparser，以此通过body传递的数据
 *  3.未兼容form等形式请求的数据
 *  4.代理转发的前置函数（代理请求前钩子） !必须使用Promise
 *    param {Object} [option] http转发的option
 *    param {Object} [req] node原生req
 *    param {Object} [res] node原生res
 *    return {Promise} promise的完成状态
 *    example option.onReq = function(option, req, res){}
 *
 *  代理转发的后置函数（代理响应后钩子） !必须使用Promise
 *    param {Object} [data] http转发获得的结果
 *    param {Object} [req] node原生req
 *    param {Object} [res] node原生res
 *    return {Promise} promise的完成状态
 *    example option.onRes = function(data, req, res){}
 *
 * 代理转发的错误函数（代理报错时钩子）
 *    param {Error} [err] http转发发生的错误
 *    param {Object} [req] node原生req
 *    param {Object} [res] node原生res
 *    param {Function} [next] express的next函数
 *    return {Promise} promise的完成状态
 *    example option.onErr = function(err, req, res, next){}
 */
var proxy = function(option) {
    if (!option.target) {
        throw new Error('proxy must have target')
    }
    var target = option.target;
    var apiProxyPath,
        onReq,
        onRes,
        onErr;
    if (option.apiProxyPath && _.isArray(option.apiProxyPath)) {
        apiProxyPath = option.apiProxyPath;
    }
    if (option.onReq && typeof option.onReq === 'function') {
        onReq = option.onReq;
    }
    if (option.onRes && typeof option.onRes === 'function') {
        onRes = option.onRes;
    }
    if (option.onErr && typeof option.onErr === 'function') {
        onErr = option.onErr;
    }
    var filterProxyPath = function(url) {
        var test = false;
        if (!apiProxyPath || apiProxyPath.length === 0) {
            return target + url
        }
        apiProxyPath.forEach(path => {
            if (RegExp(path).test(url)) {
                test = true;
            }
        })
        return test ? target + url : test;
    };
    // return (req, res, next) => {
    return async(ctx, next) => {
        var url = filterProxyPath(ctx.url);
        if (!url) {
            return await next();
        }
        var option = {
            method: ctx.method,
            uri: url,
            headers: ctx.headers
        };
        if (!ctx.session) {
            throw new Error('proxy midware need session');
        }
        if (ctx.method === 'POST' && !_.isEmpty(ctx.request.body)) {
            option.body = JSON.stringify(ctx.request.body);
            option.headers['content-type'] = 'application/json';
        }
        if (ctx.session.xSession) {
            option.headers['Cookie'] = ctx.session.xSession;
        }
        var handleRequest = () => {
            delete option.headers.host;
            delete option.headers['content-length'];
            delete option.headers['accept-encoding'];
            delete option.headers['accept-language'];
            return new Promise((success, fail) => {
                request(option, (err, res, body) => {
                    if (err) {
                        return fail(err)
                    }
                    if (!ctx.session.xSession) {
                        let cookie = res.headers['set-cookie'];
                        ctx.session.xSession = cookie;
                    }
                    return success(parseJSON(body));
                })
            })
        };
        var handleError = err => {
            if (onErr) {
                return onErr(err, ctx, next)
            } else {
                return console.log(err)
            }
        };
        var handleBefore = () => {
            if (onReq) {
                return onReq(option, ctx)
            } else {
                return Promise.resolve();
            }
        };
        var handleAfter = data => {
            if (onRes) {
                return onRes(data, ctx);
            } else {
                return Promise.resolve();
            }
        };
        var response = data => {
            if (typeof data === 'object') {
                ctx.body = data;
            } else {
                ctx.redirect(url);
            }
        };
        try {
            await handleBefore();
            let data = await handleRequest();
            await handleAfter(data);
            await response(data)
        }catch(err) {
            if (onErr) {
                return onErr(err, ctx, next)
            } else {
                return console.log(err)
            }
        }
    }
}
module.exports = proxy
