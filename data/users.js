import {users} from '../config/mongoCollections.js';
import bcrypt from 'bcrypt';
import {Errors} from '../helper.js';
const saltRounds = 16;

function validateName(value, errorMsg) {
  if (typeof value !== 'string') {
    throw new Error(errorMsg);
  }
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    throw new Error(errorMsg);
  }
  for (let idx = 0; idx < trimmed.length; idx++) {
    const code = trimmed.charCodeAt(idx);
    if (code < 65 || (code > 90 && code < 97) || code > 122) {
      throw new Error(errorMsg);
    }
  }
  return trimmed;
}

export const register = async (
  firstName,
  lastName,
  userId,
  password
) => {
  if (!firstName || !lastName || !userId || !password) {
    throw new Error(Errors.missing_fields);
  }

  const validFirstName = validateName(firstName, Errors.firstName_invalid);
  const validLastName = validateName(lastName, Errors.lastName_invalid);

  const trimmedId = userId.trim();
  if (typeof trimmedId !== 'string' || trimmedId.length < 5 || trimmedId.length > 10) {
    throw new Error(Errors.userId_invalid);
  }
  for (let j = 0; j < trimmedId.length; j++) {
    const code = trimmedId.charCodeAt(j);
    const isAlphaNum = (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    if (!isAlphaNum) {
      throw new Error(Errors.userId_invalid);
    }
  }
  const normalizedUserId = trimmedId.toLowerCase();

  if (typeof password !== 'string' || password.includes(' ') || password.length < 8) {
    throw new Error(Errors.password_invalid);
  }
  let hasUpper = false, hasDigit = false, hasSpecial = false;
  for (let k = 0; k < password.length; k++) {
    const code = password.charCodeAt(k);
    if (code >= 65 && code <= 90) hasUpper = true;
    else if (code >= 48 && code <= 57) hasDigit = true;
    else hasSpecial = true;
  }
  if (!hasUpper || !hasDigit || !hasSpecial) {
    throw new Error(Errors.password_invalid);
  }

  const usersCol = await users();
  const existing = await usersCol.findOne({ userId: normalizedUserId });
  if (existing) {
    throw new Error(Errors.userID_exists(normalizedUserId));
  }

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  const signupDate = `${month}/${day}/${year}`;

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = {
    firstName: validFirstName,
    lastName: validLastName,
    userId: normalizedUserId,
    password: hashedPassword,
    signupDate
  };

  const insertResult = await usersCol.insertOne(newUser);
  if (!insertResult.acknowledged) {
    throw new Error(Errors.registration_fail);
  }

  return { registrationCompleted: true };
};

export const login = async (userId, password) => {
  if (!userId || !password) {
    throw new Error(Errors.missing_fields);
  }

  if (typeof userId !== 'string') {
    throw new Error(Errors.userId_invalid);
  }
  const trimmedId = userId.trim();
  if (trimmedId.length < 5 || trimmedId.length > 10) {
    throw new Error(Errors.userId_invalid);
  }
  for (let i = 0; i < trimmedId.length; i++) {
    const code = trimmedId.charCodeAt(i);
    const isAlphaNum = (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    if (!isAlphaNum) {
      throw new Error(Errors.userId_invalid);
    }
  }

  if (typeof password !== 'string' || password.includes(' ') || password.length < 8) {
    throw new Error(Errors.password_invalid);
  }
  let hasUpper = false, hasDigit = false, hasSpecial = false;
  for (let j = 0; j < password.length; j++) {
    const code = password.charCodeAt(j);
    if (code >= 65 && code <= 90) hasUpper = true;
    else if (code >= 48 && code <= 57) hasDigit = true;
    else hasSpecial = true;
  }
  if (!hasUpper || !hasDigit || !hasSpecial) {
    throw new Error(Errors.password_invalid);
  }

  const normalizedId = trimmedId.toLowerCase();
  const usersCol2 = await users();
  const user = await usersCol2.findOne({ userId: normalizedId });
  if (!user) {
    throw new Error('Either the userId or password is invalid');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Either the userId or password is invalid');
  }

  const now2 = new Date();
  const mo = String(now2.getMonth() + 1).padStart(2, '0');
  const da = String(now2.getDate()).padStart(2, '0');
  const yr = now2.getFullYear();
  let hr = now2.getHours();
  const ampm = hr >= 12 ? 'PM' : 'AM';
  hr = hr % 12 || 12;
  const hStr = String(hr).padStart(2, '0');
  const mn = String(now2.getMinutes()).padStart(2, '0');
  const lastLogin = `${mo}/${da}/${yr} ${hStr}:${mn}${ampm}`;

  await usersCol2.updateOne(
    { _id: user._id },
    { $set: { lastLogin } }
  );

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    userId: user.userId,
    signupDate: user.signupDate,
    lastLogin
  };
};
