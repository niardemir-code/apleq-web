// Mismas reglas que Android (PasswordRules.kt): longitud, una letra, un número y que no sea habitual.
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRequirements {
  length: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  notCommon: boolean;
  basicsMet: boolean;
  meets: boolean;
}

const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '12341234', '87654321', '11111111', '00000000',
  'password', 'password1', 'password12', 'password123', 'passw0rd', 'p4ssw0rd',
  'contraseña1', 'contrasena1', 'contraseña123', 'contrasena123', 'contrasenya1',
  'qwerty123', 'qwertyui', 'qwertyuiop', 'qwerty12', 'asdf1234', 'asdfghjk', 'zxcvbnm1',
  'abc12345', 'abcd1234', 'a1234567', 'a12345678', 'admin123', 'admin1234',
  'iloveyou', 'iloveyou1', 'welcome1', 'welcome123', 'letmein1', 'monkey123', 'dragon123',
  'apleq123', 'apleq1234', 'splitzy1', 'splitzy123', 'tecnofan1',
]);

export function evaluatePassword(password: string): PasswordRequirements {
  const lower = password.toLowerCase();
  const length = password.length >= PASSWORD_MIN_LENGTH;
  const hasLetter = /\p{L}/u.test(password);
  const hasNumber = /\p{Nd}/u.test(password);
  const notCommon = !COMMON_PASSWORDS.has(lower) && new Set(lower).size >= 4;
  const basicsMet = length && hasLetter && hasNumber;
  return { length, hasLetter, hasNumber, notCommon, basicsMet, meets: basicsMet && notCommon };
}
