import { RESPOND, ERROR } from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  sqlGet: 'getVerifyNumber',
  sqlSet: 'setVerifyNumber',
  getUBP: 'getUserByPhone',
  setUPN: 'setUserPhoneNumber',
};

export default async function handler(req, res) {
  // 회원가입
  // 기능: : 탈퇴회원 활성화,  혹은 신규멤버 등록 및 보안토큰 발행,  관련멤버명단 추출
  // 리턴: : USER,  token,  schoolMember
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type', // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});
  // #3. 작업
  setBaseURL('sqls/auth/match-code'); // 끝에 슬래시 붙이지 마시오.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      resultCode: 500,
      id: 'ERR.auth.match.code.3',
      message: '인증번호 확인에 오류가 발생하였습니다.',
    });
  }
}
async function main(req, res) {
  // #3. 데이터 처리
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
  if (qVN.type === 'error') return qVN.onError(res, '3.1', 'verify code');
  if (qVN.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.auth.match.code.3.1',
      message: '인증에 실패하였습니다.',
      resultCode: 401,
    });

  // #3.2.
  const vn = qVN.message.rows[0];
  const whens = [
    whenSignup,
    whenFindEmail,
    whenResetPassword,
    whenResetPhoneNumber,
  ];
  // vn.type
  // 0: 회원가입 시인증, 1: 이메일 찾기 시 인증, 2: 비밀번호 재설정 시 인증, 3 휴대폰 번호변경
  const qRes = await whens[vn.type](vn, res, postParam);

  return qRes;
}
async function whenSignup(vn, res) {
  // #3.2.1.
  const qSVN = await QTS.sqlSet.fQuery({ id: vn.id, value: true });
  if (qSVN.type === 'error')
    return qSVN.onError(res, '3.2.1', 'verify code update set true');
  // #3.2.2.
  return RESPOND(res, {
    message: '휴대폰 인증에 성공하셨습니다.',
    resultCode: 200,
  });
}
async function whenFindEmail(vn, res) {
  // #3.3.1.
  const qUser = await QTS.getUBP.fQuery({ phone: vn.phone });
  if (qUser.type === 'error')
    return qUser.onError(res, '3.3.1', 'searching user');
  // #3.3.2.
  if (qUser.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.auth.match.code.3.3.2',
      message: '번호에 해당하는 계정을 찾을 수 없습니다.',
      resultCode: 400,
    });
  // #3.3.3.
  const qSVN = await QTS.sqlSet.fQuery({ id: vn.id, value: false });
  if (qSVN.type === 'error')
    return qSVN.onError(res, '3.3.3', 'verify code update set false');
  const user = qUser.message.rows[0];
  return RESPOND(res, {
    message: '이메일을 찾았습니다.',
    data: user.email,
    resultCode: 200,
  });
}
async function whenResetPassword(vn, res) {
  // #3.4.1.
  const qSVN = await QTS.sqlSet.fQuery({ id: vn.id, value: true });
  if (qSVN.type === 'error')
    return qSVN.onError(res, '3.4.1', 'verify code update set true');

  return RESPOND(res, {
    message: '휴대폰 인증에 성공하셨습니다.',
    resultCode: 200,
  });
}
async function whenResetPhoneNumber(vn, res, param) {
  // #3.5.1. 문자 인증을 true로 만든다.
  const qSVN = await QTS.sqlSet.fQuery({ id: vn.id, value: true });
  if (qSVN.type === 'error')
    return qSVN.onError(res, '3.5.1', 'verify code update set true');

  // #3.5.2. 파라미터에 사용자 id가 있는지 체크한다.
  if (!param.user_id)
    return ERROR(res, {
      id: 'ERR.auth.match.code.3.5.2',
      message: '번호 변경은 로그인 이후 사용이 가능합니다.',
      resultCode: 400,
    });

  // #3.5.3. 사용자 정보의 폰 번호를 바꾼다.
  const qUser = await QTS.setUPN.fQuery({ id: param.user_id, phone: vn.phone });
  if (qUser.type === 'error')
    return qUser.onError(res, '3.5.3', 'update user phone');

  // #3.5.4. 사용자 정보의 폰 인증을 초기화 한다.
  const qSVN2 = await QTS.sqlSet.fQuery({ id: vn.id, value: true });
  if (qSVN2.type === 'error')
    return qSVN2.onError(res, '3.5.4', 'verify code update set false');

  return RESPOND(res, {
    message: '번호변경이 완료되었습니다.',
    resultCode: 200,
  });
}
