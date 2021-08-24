import { RESPOND, VALIDTOKEN, ERROR } from '../../../lib/apiCommon'; // include String.prototype.fQuery

export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'GET',
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
  console.log({
    userId,
    resultCode: 200,
  });
  // #3.2 처리결과를 리턴한다.
  return RESPOND(res, {
    userId,
    resultCode: 200,
  });
}
