import argon2 from 'argon2';
import {randomBytes} from 'crypto';
import procQuery from "/lib/pgConn";

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
	if(req.body.length==0) return RESPOND(res,{});
	//#3. 데이터 처리	
	//#3.1. 비밀번호 처리 우선
	var salt=randomBytes(32);
	req.body.user_info.password=await argon2.hash(req.body.user_info.password,{salt});
	//#3.2. 작업
	var USER,
		QTS={	//Query TemplateS
			getWasUsers:"getWasUsers",
			setUser:"setUser",
			getSchoolMember:"getSchoolMember",
			getUserById:"getUserById"
		},
		data=req.body,
		user_info=data.user_info,
		
	//#3.2.1. 전화번호를 바탕으로 기존 사용자가 있는지 찾아본다.
		qUsers=await QTS.getWasUsers.fQuery({phone:user_info.phone,activated:false});	
	if(qUsers.type=="error") 
		return procError(res,{id:"ERR.auth.signup.1",message:"user not found"});
	var	wasUsers=qUsers.message.rows;
		
	//#3.2.2. 기존의 번호가 있으면, 탈퇴한 번호를 재활용한다.
	if(wasUsers.length>0){
		var wasUser=wasUsers[0];
		
		//#3.2.2.1 탈퇴한 정보를 활성화하고, 새로운 정보로 수정한다(기존 정보를 재활용하지만, 기존 사용자임을 보장하진 않는다).	
		var	qSetUser=await QTS.setUser.fQuery({
				activated:true,
				password:user_info.password,
				email:user_info.email,
				name:user_info.name,
				id:wasUser.id
			});
		if(qSetUser.type=="error") 
			return procError(res,{id:"ERR.auth.signup.2",message:"user update failed"});
		
		//#3.2.2.2 활성화한 사용자의 정보를 추출한다.
		var qUser=await QTS.getUserById.fQuery({id:wasUser.id});
		if(qUser.type=="error") 
			return procError(res,{id:"ERR.auth.signup.3",message:"user not found after user update"});
		USER=qUser.message.rows[0];
		
		//#3.2.2.3 활성화한 사용자의 정보를 바탕으로 관련된 학원 인원 명단을 추출한다.
		var qSchoolMembers=await QTS.getSchoolMember.fQuery({user_id:USER.id});			
		if(qSchoolMembers.type=="error") 
			return procError(res,{id:"ERR.auth.signup.4",message:"schoolMembers query failed"});
		var	schoolMembers=qSchoolMembers.message.rows;
		
		//#3.2.2.4 활성화한 사용자의 정보를 바탕으로 타임아웃 토큰을 발행한다.
		var token=generateToken(USER);
			
		//#3.2.2.5 활성화한 사용자, 토큰, 학원인원을 리턴한다.
		return RESPOND(res,{token,USER,schoolMembers});
		
	}else{	//신규회원 창설
		
	}
};
function RESPOND(res,param){
	res.end(JSON.stringify(param));
	return;
};
function procError(res,param){
	param.type="error";
	res.end(JSON.stringify(param));
	return;
};
function generateToken(user){
	var today=new Date(),
		exp=new Date(today);		
	exp.setDate(today.getDate()+360);	
	var	param={id:user.id,name:user.name,exp:exp.getTime()/1000};
	return jwt.sign(param,process.env.JWT_SECRET);
};