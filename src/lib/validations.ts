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

export const checkoutSchema = z.object({
  email: z.string().email(),
  discountCode: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      slug: z.string(),
      quantity: z.number().int().positive()
    })
  )
});

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(10)
});
