/* eslint-disable no-template-curly-in-string */
import {
  RESPOND,
  ERROR,
  VALIDPASSWORD,
  VALIDTOKEN,
} from '../../../lib/apiCommon'; // include String.prototype.fQuery
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery
// let USER;
const QTS = {
  // Query TemplateS
  getUBI: 'getUserById',
};
let EXEC_STEP = 0;

export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});
  // #3. 데이터 처리
  // #3.1. 작업
  setBaseURL('sqls/auth/signup'); // 끝에 슬래시 붙이지 마시오.

  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.auth.check-password.3',
      message: 'server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  EXEC_STEP = '3.1.'; // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // #3.1.1 헤더에서 토큰 추출
  if (!req.headers.authorization)
    return ERROR(res, {
      id: 'ERR.auth.signout.3.1.1',
      message:
        '인증 데이터가 올바르지 않습니다. 올바른 형식은 headers 에 Authorization : Bearer {token}입니다.',
    });
  const [, token] = req.headers.authorization.split('Bearer ');

  EXEC_STEP = '3.1.2.'; // #3.1.2 토큰 검증
  const qToken = await VALIDTOKEN(token);
  if (qToken.type === 'error') return qToken.onError(res, '3.1.2');

  EXEC_STEP = '3.1.3.'; // #3.1.3 토큰에서 사용자 id 추출
  const { id: userId } = qToken.message;

  EXEC_STEP = '3.1.4.'; // #3.1.4 사용자 id가 현재 활동중인 user인지 검증
  const qUser = await QTS.getUBI.fQuery({ id: userId });
  const errMsg = '유저 정보를 확인하는 중에 쿼리 에러가 발생했습니다.';
  if (qUser.type === 'error') return qUser.onError(res, '3.1.4.1', errMsg, 401);

  EXEC_STEP = '3.1.4.5';
  // console.log(qUser.message.rows);

  EXEC_STEP = '3.1.4.6';
  if (qUser.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.auth.check-password.3.1.4.2',
      message:
        '현재 유저정보를 확인 할 수 없습니다. 재로그인 해주시기 바랍니다.',
    });

  EXEC_STEP = '3.1.4.7';
  const user = qUser.message.rows[0];

  const { password } = req.body;
  // #3.2.2. password 유효성을 검사한다.
  const validPassword = await VALIDPASSWORD(
    user.password, // encrypted password
    password, // not encrypted password
  );

  const messages = {
    false: '잘못된 비밀번호입니다. 확인 후 다시 시도해 주세요.',
    true: '올바른 비밀번호입니다.',
  };

  return RESPOND(res, {
    result: validPassword,
    message: messages[validPassword],
    resultCode: 200,
  });
}
