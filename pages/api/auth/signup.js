import getData from "/lib/pgConn";
export default async function handler(req,res){
	//회원가입
	
	//#1. cors 해제
	res.writeHead(200,{
		"Access-Control-Allow-Origin":"*",
		"Content-Type":"application/json",
		"Access-Control-Allow-Headers":"*",
		"Access-Control-Allow-Methods":"POST"
	});
	
	//#2. operation
	/* const q1="select * from member;";
	let data=await getData(q1); */
	console.log(req.body);
	
	
	//#3. data return
	res.end(JSON.stringify(data));	
};