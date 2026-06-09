import { z } from "zod";

export const lessonPlanSchema = z.object({
  name: z.string().min(1, "プラン名を入力してください"),
  description: z.string().optional(),
  durationMin: z.coerce.number().int().min(15, "15分以上を指定してください"),
  price: z.coerce.number().int().min(0, "価格は0以上を指定してください"),
  billingType: z.enum(["ONE_TIME", "SUBSCRIPTION"]),
  stripePriceId: z.string().optional(),
  stripeProductId: z.string().optional(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const availabilitySlotSchema = z.object({
  coachId: z.string().min(1, "コーチを選択してください"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付を選択してください"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "開始時刻を入力してください"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "終了時刻を入力してください"),
  isOpen: z.coerce.boolean().optional().default(true),
});

export const createBookingSchema = z.object({
  lessonPlanId: z.string().min(1, "レッスンプランを選択してください"),
  availabilitySlotId: z.string().min(1, "空き枠を選択してください"),
});

export const adminLoginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type LessonPlanInput = z.infer<typeof lessonPlanSchema>;
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
