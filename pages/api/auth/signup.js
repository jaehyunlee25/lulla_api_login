import procQuery from "/lib/pgConn";
import fs from "fs";
export default async function handler(req,res){
	//회원가입	
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
		qUsers=await procQuery("select * from users where phone='"+user_info.phone+"' and activated=false;");
		
	if(qUsers.type=="error") return res.end("{type:'error',message:'user not found.'}");
		
	var	wasUsers=qUsers.message.rows;
	
	console.log(fs.readFileSync("/sqls/auth/signup/test.sql"));
	
	if(wasUsers.length>0){	//기존의 번호인데, 탈퇴한 번호를 재활용
		var USER,
			wasUser=wasUsers[0],
			updateParams={
				activated:true,
				password:user_info.password,
				email:user_info.email,
				name:user_info.name
			},
			sets=Object.keys(updateParams).map(key=>[key,"='",updateParams[key],"'"].join("")),
			sql="update users set "+sets.join(",")+" where id='"+wasUser.id+"';",
			updateResult=await procQuery(sql);
			
		if(updateResult.type=="success"){
			USER=updateResult.message;
			var token=generateToken(USER);
		}else if(updateResult.type=="error"){
			USER={type:"error",message:"can't update user!!"};
		}
	}
		
	
	//#2. operation
	/* const q1="select * from member;";
	let data=await getData(q1); */
	
	
	//#3. data return
	res.end(JSON.stringify(wasUsers));
};
function generateToken(user){
	var today=new Date(),
		exp=new Date(today);
		
	exp.setDate(today.getDate()+360);
	
	var	param={
		id:user.id,
		name:user.name,
		exp:exp.getTime()/1000
	};
	return jwt.sign(param,config.jwt_secret);
};