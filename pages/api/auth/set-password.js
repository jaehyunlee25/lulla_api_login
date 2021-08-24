/* eslint-disable no-template-curly-in-string */
import { RESPOND, VALIDTOKEN, PASSWORD, ERROR } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  setPasswordById: 'setPasswordById',
  gUBIA: 'getUserByIdActivated',
};
export default async function handler(req, res) {
  // 회원조회
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST',
  });
  // #2. preflight 처리
  if (req.body.length === 0) return RESPOND(res, {});
  // #2. 작업
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.auth.signup.setPassword.3',
      message: 'server logic error',
    });
  }
}
async function main(req, res) {
  // #3. 데이터 처리
  // #3.1. 작업
  setBaseURL('sqls/auth/set-password'); // 끝에 슬래시 붙이지 마시오.
  let { password } = req.body.user_info;

  // #3.1.1 헤더에서 토큰 추출
  if (!req.headers.authorization)
    return ERROR(res, {
      id: 'ERR.auth.signout.3.1.1',
      message:
        '인증 데이터가 올바르지 않습니다. 올바른 형식은 headers 에 Authorization : Bearer {token}입니다.',
    });
  const [, token] = req.headers.authorization.split('Bearer ');

  // #3.1.2 토큰 검증
  const qToken = await VALIDTOKEN(token);
  if (qToken.type === 'error') return qToken.onError(res, '3.1.2');

  // #3.1.3 토큰에서 사용자 id 추출
  const { id: userId } = qToken.message;

  // #3.1.4 id의 유효성 검증
  const qUser = await QTS.gUBIA.fQuery({ id: userId, password });
  if (qUser.type === 'error')
    return qUser.onError(res, '3.1.4', 'getting user');
  if (qUser.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.auth.set-password.3.1.4',
      message: 'no user activated',
    });

  // #3.1.5 패스워드 암호화
  if (password) password = await PASSWORD(req.body.user_info.password);

  // #3.1.6 사용자 id로 사용자 패스워드 수정
  const qSetPWD = await QTS.setPasswordById.fQuery({ id: userId, password });
  if (qSetPWD.type === 'error')
    return qSetPWD.onError(res, '3.1.5', 'Setting First Word');

  // #3.2 처리결과를 리턴한다.
  return RESPOND(res, {
    message: '비밀번호를 변경했습니다.',
    resultCode: 200,
  });
}
