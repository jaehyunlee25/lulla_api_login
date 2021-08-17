/* eslint-disable no-template-curly-in-string */
import axios from 'axios';
import admin from 'firebase-admin';
import { RESPOND, ERROR, PASSWORD, TOKEN } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

let USER;
const QTS = {
  // Query TemplateS
  getWasUsers: 'getWasUsers',
  setUser: 'setUser',
  getSchoolMember: 'getSchoolMember',
  getUserById: 'getUserById',
  getSameEmails: 'getSameEmails',
  getSamePhones: 'getSamePhones',
  getVerifyNumber: 'getVerifyNumber',
  newUser: 'newUser',
};
async function procSocial(res, data) {
  console.log('social');
  // #3.3. 소셜로그인 기능을 사용한다.
  const { access_token: accessToken, user_info: userInfo, type } = data;
  userInfo.password = null;
  const region = type === 'kakao' || type === 'naver' ? 'local' : 'abroad';
  const options = {
    kakao: {
      address: 'https://kapi.kakao.com/v2/user/me',
      suffix: 'kakao_account',
    },
    naver: {
      address: 'https://openapi.naver.com/v1/nid/me',
      suffix: 'response',
    },
  };
  const option = options[type];
  const Authorization = 'Bearer ${accessToken}'.proc({ accessToken });
  if (region === 'local') {
    // #3.3.1 카카오와 네이버의 경우 openapi를 사용한다.
    try {
      const response = await axios({
        method: 'GET',
        url: option.address,
        headers: { Authorization },
      });
      userInfo.email = response.data[option.suffix].email;
    } catch (e) {
      return ERROR(res, {
        id: 'ERR.auth.signup.social.3.3.1',
        message:
          '카카오 정보 요청에 실패하였습니다. access_token을 확인해주세요',
        resultCode: 401,
      });
    }
  } else if (region === 'abroad') {
    // #3.3.2 구글과 애플의 경우 firebase를 사용한다.
    // #3.3.2.1 토큰을 검증한다.
    try {
      const response = await admin.auth().verifyIdToken(accessToken);
      userInfo.email = response.email;
    } catch (e) {
      return ERROR(res, {
        id: 'ERR.auth.signup.social.3.2.1',
        message:
          'Firebase에서 데이터 정보를 가져올 수 없습니다. access_token을 확인해주세요',
        resultCode: 401,
      });
    }
    // #3.3.3.1 이메일 중복 체크
    // 카카오의 경우 법인 서류 등록 후 이메일 주소 추출 가능
    const qSEs = await QTS.getSameEmails.fQuery({ email: userInfo.email });
    if (qSEs.type === 'error')
      return qSEs.onError(res, '3.2.3.1', 'search email');
    if (qSEs.message.rows.length > 0)
      return ERROR(res, {
        id: 'ERR.auth.signup.3.2.3.1.2',
        message: 'same email existing',
      });
  }

  return userInfo;
}
async function procLocal(res, data) {
  const { user_info: userInfo } = data;
  // #3.2.1. 전화번호를 바탕으로 기존 사용자가 있는지 찾아본다.
  const qUsers = await QTS.getWasUsers.fQuery({
    phone: userInfo.phone,
    activated: false,
  });
  if (qUsers.type === 'error')
    return ERROR(res, {
      id: 'ERR.auth.signup.1',
      message: 'user not found',
    });
  const wasUsers = qUsers.message.rows;
  // #3.2.2. 기존의 번호가 있으면,  탈퇴한 번호를 재활용한다.
  if (wasUsers.length > 0) {
    const wasUser = wasUsers[0];
    // #3.2.2.1 탈퇴한 정보를 활성화하고,  새로운 정보로 수정한다(기존 정보를 재활용하지만,  기존 사용자임을 보장하진 않는다).
    const qSetUser = await QTS.setUser.fQuery({
      activated: true,
      password: userInfo.password,
      email: userInfo.email,
      name: userInfo.name,
      id: wasUser.id,
    });
    if (qSetUser.type === 'error')
      return qSetUser.onError(res, '3.2.2.1', 'user update');
    // #3.2.2.2 활성화한 사용자의 정보를 추출한다.
    const qUser = await QTS.getUserById.fQuery({ id: wasUser.id });
    if (qUser.type === 'error')
      return qUser.onError(res, '3.2.2.2', 'search user');
    [USER] = qUser.message.rows;
    // #3.2.3. 기존의 번호가 없으면,  새로 등록한다.
  } else {
    // 신규회원 창설
    // 주로 정보의 중복이나 검증에 관한 작업이다.
    // #3.2.3.2 전화번호 중복 체크
    const qSPs = await QTS.getSamePhones.fQuery({ phone: userInfo.phone });
    if (qSPs.type === 'error')
      return qSPs.onError(res, '3.2.3.2.1', 'search phone');
    if (qSPs.message.rows.length > 0)
      return ERROR(res, {
        id: 'ERR.auth.signup.3.2.3.2.2',
        message: 'same phone existing',
      });
    // #3.2.3.3 전화번호 인증 체크
    const qVN = await QTS.getVerifyNumber.fQuery({ phone: userInfo.phone });
    if (qVN.type === 'error')
      return qVN.onError(res, '3.2.3.3.1', 'phone verify');
    if (qVN.message.rows.length === 0)
      return ERROR(res, {
        id: 'ERR.auth.signup.3.2.3.3.2',
        message: 'not verified number',
      });
  }
  return userInfo;
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
  // #3.1. 비밀번호 처리 우선
  if (req.body.user_info.password)
    req.body.user_info.password = await PASSWORD(req.body.user_info.password);
  // #3.2. 작업
  setBaseURL('sqls/auth/signup'); // 끝에 슬래시 붙이지 마시오.
  const data = req.body;

  const userInfo =
    data.type === 'local'
      ? await procLocal(res, data)
      : await procSocial(res, data); // 결국, 이메일 주소를 추출하는 과정이다.
  if (userInfo === 'error') return false;

  // #3.2.4.1 이메일 중복 체크
  const qSEs = await QTS.getSameEmails.fQuery({ email: userInfo.email });
  if (qSEs.type === 'error')
    return qSEs.onError(res, '3.2.4.1', 'search email');
  if (qSEs.message.rows.length > 0)
    return ERROR(res, {
      id: 'ERR.auth.signup.3.2.4.1.2',
      message: 'same email existing',
    });

  // #3.2.4.2 등록절차
  const qNU = await QTS.newUser.fQuery({
    name: userInfo.name,
    email: userInfo.email,
    phone: userInfo.phone,
    password: userInfo.password,
    provider: data.type,
  });
  if (qNU.type === 'error') return qNU.onError(res, '3.2.4.2.1', 'user insert');
  // #3.2.4.3 등록된 사용자 정보 추출
  const userId = qNU.message.rows[0].id;
  const qUser = await QTS.getUserById.fQuery({ id: userId });
  if (qUser.type === 'error')
    return qUser.onError(res, '3.2.4.2.1', 'search user after user insert');
  [USER] = qUser.message.rows;

  // #3.2.4.4 활성화한 사용자의 정보를 바탕으로 관련된 학원 인원 명단을 추출한다.
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
