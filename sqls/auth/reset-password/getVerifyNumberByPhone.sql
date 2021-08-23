select 
	*
from 
	verify_numbers
where
	phone='${phone}'
	and is_verify=true
	and type=2;	-- 0: 회원가입 시인증, 1: 이메일 찾기 시 인증, 2: 비밀번호 재설정 시 인증, 3 휴대폰 번호