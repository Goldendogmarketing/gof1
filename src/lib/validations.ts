import { z } from "zod";

const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number().int().positive().optional().nullable()
);

// Used by the inline price editor on /admin/products.
// `compareAtCents` is optional/nullable so the admin can clear the strike-through MSRP.
export const priceOverrideSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("override"),
    priceCents: z.coerce.number().int().positive(),
    compareAtCents: z
      .preprocess(
        (value) => (value === "" || value === undefined ? undefined : value === null ? null : Number(value)),
        z.number().int().positive().nullable().optional()
      )
  }),
  z.object({
    action: z.literal("reset")
  })
]);

export const productFormSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().min(8),
  description: z.string().min(20),
  priceCents: z.coerce.number().int().positive(),
  compareAtCents: optionalPositiveInt,
  categorySlug: z.string().min(2),
  categoryName: z.string().min(2),
  flavor: z.string().optional(),
  size: z.string().optional(),
  imageUrl: z.string().min(1),
  isFeatured: z.coerce.boolean().optional(),
  inventoryQuantity: z.coerce.number().int().min(0)
});

// US state codes — kept loose (2-letter regex) so it accepts every territory
// without us maintaining a hard-coded list.
const stateCode = z.string().trim().regex(/^[A-Za-z]{2}$/, "Use a 2-letter state code").transform((v) => v.toUpperCase());
const usZip = z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP (or ZIP+4)");

export const shippingAddressSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  addressLine1: z.string().trim().min(1, "Street address is required"),
  addressLine2: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required"),
  state: stateCode,
  zip: usZip,
  phone: z.string().trim().min(7, "Enter a valid phone number")
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

export const checkoutSchema = z.object({
  email: z.string().email(),
  shippingAddress: shippingAddressSchema,
  items: z.array(
    z.object({
      productId: z.string(),
      slug: z.string(),
      quantity: z.number().int().positive()
    })
  )
});

// Used by the inline editor on /admin/customers. Email + name + phone are all
// optional in the update payload — the admin only sends fields they're changing.
export const customerUpdateSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()).optional(),
  firstName: z.string().trim().nullable().optional(),
  lastName: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  addressLine1: z.string().trim().nullable().optional(),
  addressLine2: z.string().trim().nullable().optional(),
  city: z.string().trim().nullable().optional(),
  // State: 2-letter code, uppercased, but allow null to clear it.
  state: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "Use a 2-letter state code")
    .transform((v) => v.toUpperCase())
    .nullable()
    .optional(),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP (or ZIP+4)").nullable().optional(),
  marketingOptIn: z.boolean().optional()
});

export const newAdminUserSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  name: z.string().trim().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "STAFF"]).default("ADMIN")
});

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(10)
});
