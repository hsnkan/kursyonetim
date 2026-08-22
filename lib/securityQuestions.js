export const SECURITY_QUESTIONS = [
  "İlk evcil hayvanınızın adı nedir?",
  "İlkokul öğretmeninizin adı nedir?",
  "Doğduğunuz şehir neresidir?",
  "En sevdiğiniz çocukluk arkadaşınızın adı nedir?",
];

export function isValidSecurityQuestion(value) {
  return SECURITY_QUESTIONS.includes(value);
}
