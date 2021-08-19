/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-param-reassign */
/* eslint no-extend-native: ['error', { "exceptions": ["String"] }] */
import axios from 'axios';
import argon2 from 'argon2';
import admin from 'firebase-admin';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

String.prototype.proc = function proc(param) {
  let self = this;
  Object.keys(param).forEach((key) => {
    const regex = new RegExp(['\\$\\{', key, '\\}'].join(''), 'g'); // 백슬래시 두 번,  잊지 말 것!!
    const val = param[key];
    self = self.replace(regex, val);
  });
  return self;
};
function verify(token) {
  const promise = new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          type: 'success',
          message: data,
        });
      }
    });
  });
  return promise;
}
export async function SOCIAL(res, data) {
  let email;
  const { access_token: accessToken, type } = data;
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
      email = response.data[option.suffix].email;
    } catch (e) {
      return {
        type: 'error',
        message: {
          id: 'ERR.auth.common.social.3.3.1',
          message:
            '${type} 정보 요청에 실패하였습니다. access_token을 확인해주세요'.proc(
              { type },
            ),
          resultCode: 401,
        },
      };
    }
  } else if (region === 'abroad') {
    // #3.3.2 구글과 애플의 경우 firebase를 사용한다.
    // #3.3.2.1 토큰을 검증한다.
    try {
      const response = await admin.auth().verifyIdToken(accessToken);
      email = response.email;
    } catch (e) {
      return {
        type: 'error',
        message: {
          id: 'ERR.auth.common.social.3.2.1',
          message:
            'Firebase에서 데이터 정보를 가져올 수 없습니다. access_token을 확인해주세요',
          resultCode: 401,
        },
      };
    }
  }
  return { type: 'success', message: email };
}
export async function VALIDPASSWORD(pass1, pass2) {
  const res = await argon2.verify(pass1, pass2);
  return res;
}
export async function PASSWORD(password) {
  // 비밀번호 해시처리
  const salt = randomBytes(32);
  const res = await argon2.hash(password, { salt });
  return res;
}
export async function VALIDTOKEN(token) {
  let result;
  try {
    result = await verify(token);
  } catch (e) {
    const errMsg =
      '유효하지 않은 토큰입니다. 재로그인 하여 토큰을 발급받아서 사용해주세요.';
    result = {
      type: 'error',
      onError: (res, id) => {
        const prm = {
          type: 'error',
          resultCode: 401,
          id: ['ERR', 'VALIDTOKEN', id].join('.'),
          name: [errMsg].join(' '),
        };
        res.end(JSON.stringify(prm));
        return 'error';
      },
    };
  }
  return result;
}
export function TOKEN(user) {
  const today = new Date();
  const exp = new Date(today);
  exp.setDate(today.getDate() + 360);
  const param = {
    id: user.id,
    name: user.name,
    exp: exp.getTime() / 1000,
  };
  return jwt.sign(param, process.env.JWT_SECRET);
}
export function RESPOND(res, param) {
  res.end(JSON.stringify(param));
}
export function ERROR(res, param) {
  param.type = 'error';
  param.resultCode = 400;
  res.end(JSON.stringify(param));
  return 'error';
}
export function getRandom(start, end) {
  const amount = end - start;
  const rslt = Math.random() * (amount + 1) + start;
  return parseInt(rslt, 10);
}
