import { RESPOND, VALIDTOKEN, ERROR } from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getUBI: 'getUserById',
};
export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'GET',
  });
  // #2. preflight 처리(OPTIONS 로 처리) :: GET일 땐 처리하지 않는다.
  // if (req.method === 'OPTIONS') return RESPOND(res, {});
  // #2. 작업
  setBaseURL('sqls/auth/signup'); // 끝에 슬래시 붙이지 마시오.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.auth.signup.getUserIdFromToken.1',
      message: 'server logic error',
      name: e.toString(),
    });
  }
}
async function main(req, res) {
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
  // #3.1.3 사용자 id가 현재 활동중인 user인지 검증
  const qUser = await QTS.getUBI.fQuery({ id: userId });
  const errMsg = '유저 정보를 확인하는 중에 쿼리 에러가 발생했습니다.';
  if (qUser.type === 'error') return qUser.onError(res, '3.1.4', errMsg, 401);
  if (qUser.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.auth.signin.3.1.4',
      message:
        '현재 유저정보를 확인 할 수 없습니다. 재로그인 해주시기 바랍니다.',
    });

  // #3.2 처리결과를 리턴한다.
  return RESPOND(res, {
    userId,
    resultCode: 200,
  });
}
