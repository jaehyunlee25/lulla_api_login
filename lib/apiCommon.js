import argon2 from 'argon2';
import {randomBytes} from 'crypto';
import jwt from 'jsonwebtoken';

export async function PASSWORD(password){
	//비밀번호 해시처리
	var salt=randomBytes(32);
	return await argon2.hash(password,{salt});
};
export function TOKEN(user){
	var today=new Date(),
		exp=new Date(today);		
	exp.setDate(today.getDate()+360);	
	var	param={id:user.id,name:user.name,exp:exp.getTime()/1000};
	return jwt.sign(param,process.env.JWT_SECRET);
};
export function RESPOND(res,param){
	res.end(JSON.stringify(param));
	return;
};
export function ERROR(res,param){
	param.type="error";
	param.resultCode=400;
	res.end(JSON.stringify(param));
	return;
};