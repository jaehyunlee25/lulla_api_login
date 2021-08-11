import getData from "/lib/pgConn";
export default async function handler(req,res){
	//회원가입
	
	//preflight request 처리
	
	//#1. cors 해제
	res.writeHead(200,{
		"Access-Control-Allow-Origin":"*",
		"Content-Type":"application/json",
		"Access-Control-Allow-Headers":"*",
		"Access-Control-Allow-Methods":"POST"
	});
	
	if(req.body.length==0){
		console.log(req);
		res.end("{}");
	}else{
		var data=req.body,
			user_info=JSON.parse(data).user_info,
			temporary,
			result=await getData("select * from users where phone='"+user_info.phone+"' and activated=false;"),
			rows=result.rows;
		
		
		//#2. operation
		/* const q1="select * from member;";
		let data=await getData(q1); */
		
		
		//#3. data return
		res.end(JSON.stringify(result));		
		
	}
	
	
};