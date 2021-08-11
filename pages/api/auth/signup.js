import getData from "/lib/pgConn";
export default async function handler(req,res){
	//회원가입
	
	//preflight request 처리
	
	//#1. cors 해제
	res.writeHead(200,{
		"Access-Control-Allow-Origin":"*",	//for same origin policy
		"Content-Type":"application/json",
		"Access-Control-Allow-Headers":"*",	//for application/json 
		"Access-Control-Allow-Methods":"POST"
	});
	
	//#2. preflight 처리
	if(req.body.length==0) return res.end("{}");
	
	//#3. 데이터 처리
	var data=req.body,
		user_info=JSON.parse(data).user_info,
		temporary,
		result=await getData("select * from users where phone='"+user_info.phone+"' and activated=false;"),
		rows=result.rows;
	
	if(rows.length>0){
		var wasUser=rows[0];
		
		wasUser.activated=true;
		wasUser.password=user_info.password;
		wasUser.email=user_info.email;
		wasUser.updated_at=new Date();
		
		var sets=Object.keys(wasUser).map(key=>[key,"='",wasUser[key],"'"].join(""));
		
		var sql="update users set "+sets.join(",")+" where id="+wasUser.id+";";
		console.log(sql);
		var upRes=getData(sql);
		
	}
		
	
	//#2. operation
	/* const q1="select * from member;";
	let data=await getData(q1); */
	
	
	//#3. data return
	res.end(JSON.stringify(result));
};