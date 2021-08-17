import { RESPOND } from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

export default async function handler(req, res) {
  // 회원가입
  // 기능: : 탈퇴회원 활성화,  혹은 신규멤버 등록 및 보안토큰 발행,  관련멤버명단 추출
  // 리턴: : USER,  token,  schoolMember
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type', // for application/json
    'Access-Control-Allow-Methods': 'POST',
  });
  // #2. preflight 처리
  if (req.body.length === 0) return RESPOND(res, {});
  // #3. 데이터 처리
  setBaseURL('sqls/auth/match-code'); // 끝에 슬래시 붙이지 마시오.
  const QTS = {
    // Query TemplateS
    sqlGet: 'getVerifyNumber',
    sqlSet: 'setVerifyNumber',
  };
  const data = req.body;
  const { verify: postParam } = data;

  // #3.0.1. 전화번호에서 숫자 외의 기호 삭제
  postParam.phone = postParam.phone.replace(/-/g, '');

  // #3.1.
  const qVN = await QTS.sqlGet.fQuery({
    phone: postParam.phone,
    code: postParam.code,
    type: postParam.type,
  });
  if (qVN.type === 'error') return qVN.onError(res, '3.1.1', 'verify code');

  // #3.2.
  const vn = qVN.message.rows[0];
  // 신규가입일 때,
  if (vn.type === 0) {
    // #3.2.1.
    const qSVN = await QTS.sqlSet.fQuery({ id: vn.id });
    if (qSVN.type === 'error')
      return qSVN.onError(res, '3.2.1', 'verify code update');
    // #3.2.2.
    return RESPOND(res, {
      message: '휴대폰 인증에 성공하셨습니다.',
      resultCode: 200,
    });
  }
  return true;
}
