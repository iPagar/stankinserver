const crypto = require("crypto");
const createError = require("http-errors");

const key = process.env.VK_SECURE;

function ksort(query) {
	return query
		.slice(1)
		.split("&")
		.map(queryParam => {
			let kvp = queryParam.split("=");
			return { key: kvp[0], value: kvp[1] };
		})
		.reduce((query, kvp) => {
			query[kvp.key] = kvp.value;
			return query;
		}, {});
}

function checkSign(req, res, next) {
	const query = req.headers[`x-sign-header`];
	let params = ksort(query);

	const sign = params.sign;
	let str = Object.keys(params).reduce((signQuery, param) => {
		if (param.indexOf("vk_") !== -1)
			return (signQuery += `${param}=${params[`${param}`]}&`);
		else return signQuery;
	}, "?");
	str = str.substring(1, str.length - 1);

	let hash = crypto
		.createHmac("sha256", key)
		.update(str)
		.digest("base64")
		.split("+")
		.join("-")
		.split("/")
		.join("_")
		.replace("=", "");

	if (hash === sign) {
		delete req.body.sign;
		req.body = { params, ...req.body };
		next();
	} else next(createError(401));
}

module.exports = {
	checkSign
};
