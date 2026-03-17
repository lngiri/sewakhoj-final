import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  try {
    await client.messages.create({
      body: `आपको SewaKhoj को लागि OTP हो: ${otp}. यो OTP ५ मिनेटमै म्याद सकिन्छ।`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

export const verifyPhoneFormat = (phone: string): boolean => {
  const nepaliPhoneRegex = /^\+977[0-9]{9,10}$/;
  return nepaliPhoneRegex.test(phone);
};
