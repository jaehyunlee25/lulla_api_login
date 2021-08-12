import argon2 from 'argon2';
import {randomBytes} from 'crypto';
import procQuery from "/lib/pgConn";
import fs from "fs";	//fs의 baseUrl은 프로젝트 메인이다. 
import jwt from 'jsonwebtoken';
export default async function handler(req,res){
	//회원가입	
	//#1. cors 해제
	res.writeHead(200,{
		"Access-Control-Allow-Origin":"*",	//for same origin policy
		"Content-Type":"application/json",
		"Access-Control-Allow-Headers":"Content-Type",	//for application/json 
		"Access-Control-Allow-Methods":"POST"
	});	
	//#2. preflight 처리
	if(req.body.length==0) return res.end("{}");
	
	//#3. 데이터 처리	
	//#3.1. 비밀번호 처리 우선
	const salt=randomBytes(32);
	req.body.user_info.password=await argon2.hash(req.body.user_info.password,{salt});
	//#3.2. 작업	
	var data=req.body,
		user_info=data.user_info,
		//qUsers=await getSqlFile("getWasUsers",{phone:user_info.phone,activated:false}).query();
		qUsers=await ("getWasUsers").fQuery({phone:user_info.phone,activated:false});
	
	if(qUsers.type=="error") return res.end("{type:'error',message:'user not found.'}");
		
	var	wasUsers=qUsers.message.rows;	
	if(wasUsers.length>0){	//기존의 번호인데, 탈퇴한 번호를 재활용
		var USER,
			wasUser=wasUsers[0],
			updateParams={
				activated:true,
				password:user_info.password,
				email:user_info.email,
				name:user_info.name,
				id:wasUser.id
			},
			sql=getSqlFile("setUser",updateParams),
			updateResult=await procQuery(sql);
			
		if(updateResult.type=="success"){
			
			USER=await getUser(wasUser.id);
			
			var token=generateToken(USER),
				smQueryString=getSqlFile("getSchoolMember",{user_id:USER.id}),			
				qSchoolMembers=await procQuery(smQueryString),
				schoolMembers=qSchoolMembers.message.rows;
				
			//#3. data return
			res.end(JSON.stringify({token,USER,schoolMembers}));

		}else if(updateResult.type=="error"){
			USER={type:"error",message:"can't update user!!"};
		}
	}else{	//신규회원 창설
		
	}
};
String.prototype.fQuery=async function(param){
	var path="sqls/auth/signup/"+this+".sql",
		sql=fs.readFileSync(path,"utf8");
	Object.keys(param).forEach(key=>{
		var regex=new RegExp("\\$\\{"+key+"\\}","g"),	//백슬래시 두 번, 잊지 말 것!!
			val=param[key];
		sql=sql.replace(regex,val);
	});
	
	console.log(sql,"\n\n\n\n\n");
	
	return await procQuery(this);
};
String.prototype.query=async function(){
	return await procQuery(this);
};
async function getUser(id){
	var sql=getSqlFile("getUserById",{id:id}),
		users=await procQuery(sql);	
	if(users.type=="error") return users;	
	var user=users.message.rows[0];
	return user;
};
function getSqlString(str,param){
	var sql=str;
	Object.keys(param).forEach(key=>{
		var regex=new RegExp("\\$\\{"+key+"\\}","g"),	//백슬래시 두 번, 잊지 말 것!!
			val=param[key];
		sql=sql.replace(regex,val);
	});
	
	console.log(sql,"\n\n\n\n\n");
	
	return sql;
};
function getSqlFile(sqlName,param){
	var path="sqls/auth/signup/"+sqlName+".sql",
		sql=fs.readFileSync(path,"utf8");
	Object.keys(param).forEach(key=>{
		var regex=new RegExp("\\$\\{"+key+"\\}","g"),	//백슬래시 두 번, 잊지 말 것!!
			val=param[key];
		sql=sql.replace(regex,val);
	});
	
	console.log(sql,"\n\n\n\n\n");
	
	return sql;
};
function generateToken(user){
	var today=new Date(),
		exp=new Date(today);		
	exp.setDate(today.getDate()+360);	
	var	param={id:user.id,name:user.name,exp:exp.getTime()/1000};
	return jwt.sign(param,process.env.JWT_SECRET);
};