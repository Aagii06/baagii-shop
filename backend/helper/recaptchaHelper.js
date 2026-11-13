// Google reCAPTCHA v2 ("Би робот биш" checkbox) — вэбийн маягтын токеныг шалгана.
// RECAPTCHA_SECRET_KEY хоосон бол шалгахгүй (локал хөгжүүлэлт).
const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

module.exports.verifyRecaptcha = async (token, ip) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return;
  if (!token) throw "«Би робот биш» гэдгийг баталгаажуулна уу";

  let data;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: String(token), ...(ip ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(10000),
    });
    data = await res.json();
  } catch (error) {
    console.log("recaptchaVerifyError:", error);
    throw "Баталгаажуулалт хийж чадсангүй. Дахин оролдоно уу";
  }
  if (!data?.success) throw "«Би робот биш» баталгаажуулалт хүчингүй болсон байна. Дахин тэмдэглэнэ үү";
};
