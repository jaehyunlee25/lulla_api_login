import getData from "/lib/pgConn";
export default async function handler(req,res){
	//cors 해제
	//console.log(res);
	res.writeHead(200,{
		"Access-Control-Allow-Origin":"*",
		"Access-Control-Allow-Methods":"POST"
	});
	res.end("{'msg':'hello'}");
	/* res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With"); */
	
	/* if(req.method!="POST"){
		res.status(200).json({result:"fail",reason:"not proper method"});
		return;
	} */
	/* const q1="select * from member;";
	let data=await getData(q1);
	res.status(200).json(data); */
};