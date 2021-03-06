/* eslint-disable no-template-curly-in-string */
import { RESPOND, VALIDTOKEN, ERROR } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getUBI: 'getUserById',
  initUser: 'userInitialize',
};
export default async function handler(req, res) {
  // 회원탈퇴
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'authorization'], // for application/json
    'Access-Control-Allow-Methods': 'GET',
  });
  // #2. preflight 처리
  /* if (req.body.length === 0) return RESPOND(res, {}); */
  // #3. 데이터 처리
  // #3.1. 작업
  setBaseURL('sqls/auth/signout'); // 끝에 슬래시 붙이지 마시오.

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

  // #3.1.4 사용자 id로 사용자 정보 추출
  const qUser = await QTS.getUBI.fQuery({ id: userId });
  const errMsg =
    '현재 유저정보를 확인 할 수 없습니다. 재로그인 해주시기 바랍니다.';
  if (qUser.type === 'error') return qUser.onError(res, '3.1.4', errMsg, 401);
  const [user] = qUser.message.rows;

  // #3.1.5 사용자 정보 초기화
  const qInit = await QTS.initUser.fQuery({ id: user.id });
  if (qInit.type === 'error')
    return qInit.onError(res, '3.1.5', 'signout', 500);

  // #3.2 활성화한 사용자,  토큰,  학원인원을 리턴한다.
  return RESPOND(res, {
    message: '회원탈퇴에 성공하였습니다.',
    resultCode: 200,
  });
}
