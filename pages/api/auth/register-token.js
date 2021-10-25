/* eslint-disable no-template-curly-in-string */
import { RESPOND, ERROR, VALIDTOKEN } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getUBI: 'getUserById',
  getDevice: 'getDevice',
  newDevice: 'newDevice',
  setDevice: 'setDevice',
};
export default async function handler(req, res) {
  // 회원가입
  // 기능: : 탈퇴회원 활성화,  혹은 신규멤버 등록 및 보안토큰 발행,  관련멤버명단 추출
  // 리턴: : USER,  token,  schoolMember
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});
  // #3. 데이터 처리
  // #3.2. 작업
  setBaseURL('sqls/auth/register-token'); // 끝에 슬래시 붙이지 마시오.

  // #3.2.1 헤더에서 토큰 추출
  if (!req.headers.authorization)
    return ERROR(res, {
      id: 'ERR.auth.register-token.3.2.1',
      message:
        '인증 데이터가 올바르지 않습니다. 올바른 형식은 headers 에 Authorization : Bearer {token}입니다.',
    });
  const [, token] = req.headers.authorization.split('Bearer ');

  const { user_info: userInfo } = req.body;
  const { device_token: deviceToken, type } = userInfo;

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
  if (qUser.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.auth.signin.3.1.4',
      message: '토큰 사용자가 존재하지 않습니다.',
    });

  // #3.1.5.
  const qDevice = await QTS.getDevice.fQuery({ deviceToken, type });
  if (qDevice.type === 'error')
    return qDevice.onError(res, '3.1.5', 'searching device error', 401);

  // #3.1.6.
  if (qDevice.message.rows.length === 0) {
    const qNew = await QTS.newDevice.fQuery({ userId, deviceToken, type });
    if (qNew.type === 'error')
      return qNew.onError(res, '3.1.6', 'insert device error', 401);
  } else {
    // #3.1.7.
    const device = qDevice.message.rows[0];
    if (device.user_id !== userId) {
      const qSet = await QTS.setDevice.fQuery({ userId, deviceId: device.id });
      if (qSet.type === 'error')
        return qSet.onError(res, '3.1.7', 'update device error', 401);
    }
  }

  return RESPOND(res, {
    message: '디바이스 토큰 설정에 성공하였습니다.',
    resultCode: 200,
  });
}
