/* eslint-disable no-template-curly-in-string */
import { RESPOND, PASSWORD, ERROR } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getVNBP: 'getVerifyNumberByPhone',
  gUBP: 'getUserByPhone',
  setPasswordById: 'setPasswordById',
};
export default async function handler(req, res) {
  // 회원조회
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});
  // #3. 작업
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      resultCode: 500,
      id: 'ERR.auth.signup.resetPassword.3',
      message: '비밀번호 재설정에 오류 발생',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  // #3. 데이터 처리
  // #3.1. 작업
  setBaseURL('sqls/auth/reset-password'); // 끝에 슬래시 붙이지 마시오.
  const postParam = req.body.user_info;

  // #3.1.1. 문자인증 결과를 조회한다.
  postParam.phone = postParam.phone.replace(/-/g, '');
  const qVnbp = await QTS.getVNBP.fQuery({ phone: postParam.phone });
  if (qVnbp.type === 'error')
    return qVnbp.onError(res, '3.1.1', 'getting verify number');

  // #3.1.2. 문자인증 결과가 없으면 리턴한다.
  if (qVnbp.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.auth.reset-password.3.1.2',
      message: '휴대폰 인증을 거친 후 시도해주세요.',
    });

  // #3.1.3. 폰번호를 통해 사용자를 조회한다.
  const qUser = await QTS.gUBP.fQuery({ phone: postParam.phone });
  if (qUser.type === 'error')
    return qUser.onError(res, '3.1.3', 'getting user by phone');

  // #3.1.4. 사용자가 없으면 리턴한다.
  if (qUser.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.auth.reset-password.3.1.2',
      message: '해당하는 번호에 관한 계정이 존재하지 않습니다.',
    });

  // #3.1.5 패스워드 암호화
  const password = await PASSWORD(postParam.password);

  // #3.1.6 사용자 id로 사용자 패스워드 수정
  const [user] = qUser.message.rows;
  const { id } = user;
  const qSetPWD = await QTS.setPasswordById.fQuery({ id, password });
  if (qSetPWD.type === 'error')
    return qSetPWD.onError(res, '3.1.5', 'Setting First Word');

  // #3.2 처리결과를 리턴한다.
  return RESPOND(res, {
    message: '비밀번호를 변경했습니다. 바뀐 비밀번호로 로그인해주세요.',
    resultCode: 200,
  });
}
