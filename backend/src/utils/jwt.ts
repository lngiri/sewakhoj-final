import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  phone: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '30d'
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const generateOTPExpiry = (): Date => {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
};
