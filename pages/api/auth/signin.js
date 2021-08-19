/* eslint-disable no-template-curly-in-string */
import moment from 'moment-timezone';
import {
  RESPOND,
  ERROR,
  SOCIAL,
  VALIDPASSWORD,
  TOKEN,
} from '../../../lib/apiCommon'; // include String.prototype.fQuery
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

let USER;
const QTS = {
  // Query TemplateS
  getSameEmails: 'getSameEmails',
  setLastLogin: 'setLastLogin',
  getSchoolMember: 'getSchoolMember',
};
async function procSocial(res, data) {
  // #3.3. 소셜로그인 기능을 사용한다.
  const { type } = data;
  const qEmail = await SOCIAL(res, data);
  if (qEmail.type === 'error') return ERROR(res, qEmail.message);
  const email = qEmail.message;
  // #3.3.2 이메일을 바탕으로 기존 사용자가 있는지 찾아본다.
  const qUsers = await QTS.getSameEmails.fQuery({
    email: email,
    activated: true,
  });
  if (qUsers.type === 'error')
    return qUsers.onError(res, '3.2.1.1', 'searching a user');
  if (qUsers.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.auth.signin.3.3.2',
      message: '${type} 계정으로 가입된 정보가 없습니다.'.proc({ type }),
      resultCode: 401,
    });
  const [user] = qUsers.message.rows;

  return user;
}
async function procLocal(res, data) {
  const { user_info: userInfo } = data;
  // #3.2.1. 이메일을 바탕으로 기존 사용자가 있는지 찾아본다.
  // 이메일이 존재하고, 활성화되어 있어야 한다.
  const qUsers = await QTS.getSameEmails.fQuery({
    email: userInfo.email,
    activated: true,
  });
  if (qUsers.type === 'error')
    return qUsers.onError(res, '3.2.1.1', 'searching a user');
  if (qUsers.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.auth.signin.3.2.1',
      message:
        '해당 이메일로 등록된 사용자가 없습니다. 확인 후 다시 시도해주세요.',
    });
  const [user] = qUsers.message.rows;

  // #3.2.2. password 유효성을 검사한다.
  const validPassword = await VALIDPASSWORD(
    user.password, // encrypted password
    userInfo.password, // not encrypted password
  );
  if (!validPassword)
    return ERROR(res, {
      id: 'ERR.auth.signin.3.2.2',
      message: '잘못된 비밀번호입니다. 확인 후 다시 시도해 주세요.',
    });

  return user;
}
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
  // #3.1. 작업
  setBaseURL('sqls/auth/signin'); // 끝에 슬래시 붙이지 마시오.
  const data = req.body;
  USER =
    data.type === 'local'
      ? await procLocal(res, data)
      : await procSocial(res, data); // 결국, 이메일 주소를 추출하는 과정이다.
  if (USER === 'error') return false;

  // #3.2.3. user의 로그인 정보를 갱신한다.
  const today = moment().tz('Asia/Seoul').format('YYYY-MM-DD');
  const qSLL = await QTS.setLastLogin.fQuery({
    today: today,
    id: USER.id,
  });
  if (qSLL.type === 'error') return qSLL.onError(res, '3.2.3', 'set user info');

  // #3.2.4. 활성화한 사용자의 정보를 바탕으로 관련된 학원 인원 명단을 추출한다.
  const qSchoolMembers = await QTS.getSchoolMember.fQuery({ userId: USER.id });
  if (qSchoolMembers.type === 'error')
    return qSchoolMembers.onError(res, '5', 'schoolMembers');
  const schoolMembers = qSchoolMembers.message.rows;

  // #3.2.4.5 활성화한 사용자의 정보를 바탕으로 타임아웃 토큰을 발행한다.
  const token = TOKEN(USER);

  // #3.2.4.6 활성화한 사용자,  토큰,  학원인원을 리턴한다.
  return RESPOND(res, {
    data: { USER, schoolMembers },
    token: token,
    resultCode: 200,
  });
}
