import {RESPOND,ERROR,PASSWORD,TOKEN} from "/lib/apiCommon";	//include String.prototype.fQuery
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
	//#3.1. 비밀번호 처리 우선
	req.body.user_info.password=await PASSWORD(req.body.user_info.password);
	//#3.2. 작업
	setBaseURL("sqls/auth/signup");	//끝에 슬래시 붙이지 마시오.
	var USER,
		QTS={	//Query TemplateS
			getWasUsers:"getWasUsers",
			setUser:"setUser",
			getSchoolMember:"getSchoolMember",
			getUserById:"getUserById",
			getSameEmails:"getSameEmails"
		},
		data=req.body,
		user_info=data.user_info,
		
	//#3.2.1. 전화번호를 바탕으로 기존 사용자가 있는지 찾아본다.
		qUsers=await QTS.getWasUsers.fQuery({phone:user_info.phone,activated:false});	
	if(qUsers.type=="error") 
		return ERROR(res,{id:"ERR.auth.signup.1",message:"user not found"});
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
			return ERROR(res,{id:"ERR.auth.signup.2",message:"user update failed"});
		
	//#3.2.3. 기존의 번호가 없으면, 새로 등록한다.
	}else{	//신규회원 창설
		//주로 정보의 중복이나 검증에 관한 작업이다.
		//#3.2.3.1 이메일 중복 체크
		var qSEs=getSameEmails.fQuery({email:user_info.email});
		if(qSEs.type=="error") 
			return ERROR(res,{id:"ERR.auth.signup.3.2.3.1.1",message:"email query failed"});
		if(qSEs.message.rows.length>0)
			return ERROR(res,{id:"ERR.auth.signup.3.2.3.1.2",message:"same email existing"});
		
		
	
		return RESPOND(res,{type:"empty"});
	}
	
	//#3.2.2.2 활성화한 사용자의 정보를 추출한다.
	var qUser=await QTS.getUserById.fQuery({id:wasUser.id});
	if(qUser.type=="error") 
		return ERROR(res,{id:"ERR.auth.signup.4",message:"user not found after user update"});
	USER=qUser.message.rows[0];
	
	//#3.2.2.3 활성화한 사용자의 정보를 바탕으로 관련된 학원 인원 명단을 추출한다.
	var qSchoolMembers=await QTS.getSchoolMember.fQuery({user_id:USER.id});			
	if(qSchoolMembers.type=="error") 
		return ERROR(res,{id:"ERR.auth.signup.5",message:"schoolMembers query failed"});
	var	schoolMembers=qSchoolMembers.message.rows;
	
	//#3.2.2.4 활성화한 사용자의 정보를 바탕으로 타임아웃 토큰을 발행한다.
	var token=TOKEN(USER);
		
	//#3.2.2.5 활성화한 사용자, 토큰, 학원인원을 리턴한다.
	return RESPOND(res,{token,USER,schoolMembers});
};
