import z, { string } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const forgotPassSchema = z.object({
  email: z.string().email(),
});

const resetPassSchema = z.object({
  password: z.string().min(6),
});

const registerSchema = z.object({
  userName: z
    .string()
    .optional()
    .transform((value) => !value || value.trim()),
  about: z
    .string()
    .optional()
    .transform((value) => !value || value.trim()),
  email: z.string().email(),
  mobile: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{10}$/.test(value), {
      message: "Mobile number must be 10 digits long",
    }),
  password: z
    .string()
    .min(6)
    .refine(
      (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(value),
      {
        message:
          "Password must be at least 6 characters long and contain at least one lowercase letter, one uppercase letter, and one digit",
      }
    ),
});

const updateProfileSchema = z.object({
  userName: z.string().trim().min(3),
  about: z.string().trim().min(1),
  image: z.string(),
});

export {
  loginSchema,
  forgotPassSchema,
  resetPassSchema,
  registerSchema,
  updateProfileSchema,
};
