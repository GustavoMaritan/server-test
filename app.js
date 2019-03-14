const { spawn } = require('child_process');
const path = require('path');
const requestPromise = require('request-promise');
const request = require('request');

let host, token, prefix, bat, keyExecute;

module.exports = options => {
	host = options.host;
	token = options.token;
	prefix = options.prefix;
	keyExecute = options.keyExecute || 'RODANDO';

	return {
		host,
		token,
		req,
		asyncReq,
		start,
		stop
	};
};

/**
 *
 * @param {Object} options
 *
 * @example
 *
 * server.req('url', {options}) // GET
 *
 * server.req({
 *  url:'',
 *  prefix: true,
 *  method: 'get',
 *  json: true,
 *  body: null,
 *  headers: { authorization: token },
 *  params: {}
 * })
 */
async function asyncReq(url, options) {
	if (typeof url == 'string') {
		options = options || {};
		options.url = url;
	} else if (typeof url == 'object') options = url;

	prepareUrl(options);

	let option = {
		uri: options.url,
		method: options.method || 'get',
		headers: Object.assign({ authorization: token }, options.headers || {}),
		json: typeof options.json == 'boolean' ? options.json : true,
		body: options.body
	};
	return requestPromise(option);
}

/**
 *
 * @param {*} url
 * @param {*} options
 * @param {*} callback
 *
 * @example
 *
 * server.req('url', ()=>{});
 * server.req({options}, ()=>{});
 */
function req(...params) {
	let config = {
		options: {},
		callback: null
	};

	params.map(x => {
		switch (typeof x) {
			case 'string':
				config.options.url = x;
			case 'object':
				config.options = { ...config.options, ...x };
			case 'function':
				config.callback = x;
			default:
				throw { message: `Parametro invalida ${x}` };
		}
	});

	prepareUrl(options);

	let option = {
		uri: options.url,
		method: options.method || 'get',
		headers: Object.assign({ authorization: token }, options.headers || {}),
		json: typeof options.json == 'boolean' ? options.json : true,
		body: options.body
	};
	request(option, callback);
}

function prepareUrl(options) {
	options.url = [
		host,
		typeof options.prefix == 'boolean' && !options.prefix ? '' : prefix,
		...options.url.split('/')
	]
		.filter(x => !!x)
		.join('/');

	if (!options.params) return;

	let query = [];
	for (let i in options.params) {
		if (options.url.includes(':' + i))
			options.url = options.url.replace(':' + i, options.params[i]);
		else query.push(`${i}=${options.params[i]}`);
	}
	if (query.length) options.url += '?' + query.join('&');
}

function start() {
	return new Promise((resolve, reject) => {
		bat = spawn('node', ['app'], {
			shell: false,
			cwd: __dirname.split('node_modules')[0],
			detached: false
		});

		bat.stdout.on('data', data => {
			if (new RegExp(keyExecute, 'gi').test(data)) resolve();
		});

		bat.stderr.on('data', data => {});

		bat.on('erro', data => {
			reject(data);
		});
	});
}

function stop() {
	bat.stdin.pause();
	bat.kill();
}
