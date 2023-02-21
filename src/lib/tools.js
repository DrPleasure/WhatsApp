import jwt from "jsonwebtoken";
import { body } from "express-validator"

export const createAccessToken = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1week" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    )
  );

export const verifyAccessToken = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, originalPayload) => {
      if (err) reject(err);
      else resolve(originalPayload);
    })
  );

  // Validator middleware for the request body
export const validate = (method) => {
  switch (method) {
    case 'createMessage': {
      return [
        body('content').exists().notEmpty().withMessage('Content is a required field'),
      ];
    }
    default: {
      return [];
    }
  }
};