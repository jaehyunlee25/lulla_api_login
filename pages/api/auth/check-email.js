import { RESPOND, ERROR } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

export default async function handler(req, res) {
  // 회원가입
  // 기능: : 탈퇴회원 활성화, 혹은 신규멤버 등록 및 보안토큰 발행, 관련멤버명단 추출
  // 리턴: : USER, token, schoolMember

  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type', // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});
  // #3. 데이터 처리
  setBaseURL('sqls/auth/signup'); // 끝에 슬래시 붙이지 마시오.
  const QTS = { getSameEmails: 'getSameEmails' };
  const data = req.body;
  const { user_info: userInfo } = data;

  // #3.1 이메일 중복 체크
  const qSEs = await QTS.getSameEmails.fQuery({ email: userInfo.email });
  if (qSEs.type === 'error') return qSEs.onError(res, '3.3.1', 'phone verify');
  if (qSEs.message.rows.length > 0)
    return ERROR(res, {
      id: 'ERR.auth.check-email.3.2',
      message: '이미 사용중인 이메일 주소입니다.',
    });

  // #3.2.2.5 활성화한 사용자, 토큰, 학원인원을 리턴한다.
  return RESPOND(res, {
    message: '사용 가능한 이메일 주소입니다.',
    resultCode: 200,
  });
}
