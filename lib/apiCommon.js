import argon2 from 'argon2';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

/* eslint no-extend-native: ["error", { "exceptions": ["String"] }] */
String.prototype.proc = function (param) {
  let self = this;
  Object.keys(param).forEach((key) => {
    const regex = new RegExp(['\\$\\{', key, '\\}'].join(''), 'g'); // 백슬래시 두 번,  잊지 말 것!!
    const val = param[key];
    self = self.replace(regex, val);
  });
  return self;
};
export function getRandom(start, end) {
  const amount = end - start;
  const rslt = Math.random() * (amount + 1) + start;
  return parseInt(rslt, 10);
}
export async function PASSWORD(password) {
  // 비밀번호 해시처리
  const salt = randomBytes(32);
  const res = await argon2.hash(password, { salt });
  return res;
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
/* eslint-disable no-param-reassign */
export function ERROR(res, param) {
  param.type = 'error';
  param.resultCode = 400;
  res.end(JSON.stringify(param));
  return 'error';
}
