import {RESPOND,ERROR,getRandom} from "/lib/apiCommon";	//include String.prototype.fQuery
import setBaseURL from "/lib/pgConn";	//include String.prototype.fQuery

export default async function handler(req,res){
	//회원가입	
	//기능::탈퇴회원 활성화, 혹은 신규멤버 등록 및 보안토큰 발행, 관련멤버명단 추출
	//리턴::USER, token, schoolMember
	
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
	//#3.1. 작업
	setBaseURL("sqls/auth/generate-code");	//끝에 슬래시 붙이지 마시오.
	var QTS={	//Query TemplateS
			getUserByPhone:"getUserByPhone",
			getVerifyNumber:"getVerifyNumber",
			getVerifyNumberById:"getVerifyNumberById",
			delVerifyNumber:"delVerifyNumber",
			newVerifyNumber:"newVerifyNumber",
		},
		data=req.body,
		post_param=data.verify;
		
	//#3.1.1. 전화번호에서 숫자 외의 기호 삭제
	post_param.phone=post_param.phone.replace(/\-/g,"");
	
	//#3.2. 이미 등록된 전화번호 체크
	try{
		var qUBP=await QTS.getUserByPhone.fQuery({phone:post_param.phone});
	}catch(e){
		console.log(e);
		return ERROR(res,{id:"ERR.auth.generate-code.3.2.1",message:"phone user query failed"});
	}
	if(qUBP.message.rows.length>0)
		return ERROR(res,{id:"ERR.auth.generate-code.3.2.2",message:"이미 해당하는 번호를 사용하고 있는 유저가 있습니다."});
	
	//#3.3. 이미 등록된 검사번호 체크
	try{
		var qVN=await QTS.getVerifyNumber.fQuery({phone:post_param.phone,type:post_param.type});
	}catch(e){
		console.log(e);
		return ERROR(res,{id:"ERR.auth.generate-code.3.3.1",message:"phone verify query failed"});
	}
	
	//#3.4. 이미 등록된 검사번호 삭제
	if(qVN.message.rows.length>0){
		var phone_vn_id=qVN.message.rows[0].id;
		try{
			var qDVN=await QTS.delVerifyNumber.fQuery({id:phone_vn_id});
		}catch(e){
			console.log(e);
			return ERROR(res,{id:"ERR.auth.generate-code.3.4.1",message:"phone verify number delete query failed"});
		}
	}
	
	//#3.5. 새 인증번호 등록
	let verify_code=getRandom(1000,9999);
	try{
		var qNVN=await QTS.newVerifyNumber.fQuery({
				phone:post_param.phone,
				type:post_param.type,
				code:verify_code
			});
	}catch(e){
		console.log(e);
		return ERROR(res,{id:"ERR.auth.generate-code.3.5.1",message:"new verify number query failed"});
	}
	
	//#3.6. 새 인증번호 정보 추출
	var vn_id=qNVN.message.rows[0].id;
	try{
		var qVNBI=await QTS.getVerifyNumberById.fQuery({id:vn_id});
	}catch(e){
		console.log(e);
		return ERROR(res,{id:"ERR.auth.generate-code.3.6.1",message:"getting verify number query failed"});
	}
	var VN=qVNBI.message.rows[0];
	
	//#3.7. SMS 발송
	console.log(VN);
	//#3.8 
	return RESPOND(res,{
		data:VN,
		message:'인증번호를 생성하였습니다.',
		resultCode:200
	});
};
