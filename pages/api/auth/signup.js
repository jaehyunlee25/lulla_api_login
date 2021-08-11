import getData from "/lib/pgConn";
export default async function handler(req,res){
	//cors 해제
	res.writeHead(200,{
		"Access-Control-Allow-Origin":"*",
		"Content-Type":"application/json",
		"Access-Control-Allow-Headers":"*",
		"Access-Control-Allow-Methods":"POST"
	});		
	const q1="select * from member;";
	let data=await getData(q1);
	//res.status(200).json(data);
	res.end(JSON.stringify(data));	
};