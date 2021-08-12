export function RESPOND(res,param){
	res.end(JSON.stringify(param));
	return;
};
export function procError(res,param){
	param.type="error";
	res.end(JSON.stringify(param));
	return;
};