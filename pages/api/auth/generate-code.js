import {RESPOND,ERROR,getRandom} from "/lib/apiCommon";	//include String.prototype.fQuery
import setBaseURL from "/lib/pgConn";	//include String.prototype.fQuery
import SMS from "/lib/sms";

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
			getUBP:"getUserByPhone",
			getVN:"getVerifyNumber",
			getVNBI:"getVerifyNumberById",
			delVN:"delVerifyNumber",
			newVN:"newVerifyNumber",
		},
		data=req.body,
		postParam=data.verify;
		
	//#3.1.1. 전화번호에서 숫자 외의 기호 삭제
	postParam.phone=postParam.phone.replace(/\-/g,"");
	
	//#3.2. 이미 등록된 전화번호 체크
	var qUBP=await QTS.getUBP.fQuery({phone:postParam.phone});
	if(qUBP.type=="error") return qUBP.onError(res,"3.2.1","phone user");
	if(qUBP.message.rows.length>0)
		return ERROR(res,{
			id:"ERR.auth.generate-code.3.2.2",
			message:"이미 해당하는 번호를 사용하고 있는 유저가 있습니다."
		});
	
	//#3.3. 이미 등록된 검사번호 체크
	var qVN=await QTS.getVN.fQuery({phone:postParam.phone,type:postParam.type});
	if(qVN.type=="error") return qVN.onError(res,"3.3.1","phone verify");
	
	//#3.4. 이미 등록된 검사번호 삭제
	if(qVN.message.rows.length>0){
		var phone_vn_id=qVN.message.rows[0].id,
			qDVN=await QTS.delVN.fQuery({id:phone_vn_id});
		if(qDVN.type=="error") return qDVN.onError(res,"3.4.1","phone verify number delete"); 
	}
	
	//#3.5. 새 인증번호 등록
	var verify_code=getRandom(1000,9999),
		qNVN=await QTS.newVN.fQuery({
			phone:postParam.phone,
			type:postParam.type,
			code:verify_code
		});
	if(qNVN.type=="error") return qDVN.onError(res,"3.5.1","new verify number"); 
	
	//#3.6. 새 인증번호 정보 추출
	var vn_id=qNVN.message.rows[0].id,
		qVNBI=await QTS.getVNBI.fQuery({id:vn_id});
	if(qVNBI.type=="error") return qDVN.onError(res,"3.6.1","getting verify number");  
	
	//#3.7. SMS 발송
	var VN=qVNBI.message.rows[0],
		qSms;
	try{
		qSms=await SMS({vc:verify_code,phone:postParam.phone});
	}catch(e){
		return ERROR(res,{id:"ERR.auth.signup.generate.code.3.7",message:"sending sms failed"});
	}
	
	//#3.8 사용자 리턴
	return RESPOND(res,{
		data:VN,
		message:'인증번호를 생성하였습니다.',
		resultCode:200
	});
};
