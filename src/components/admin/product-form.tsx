"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { productFormSchema } from "@/lib/validations";

type FormValues = z.infer<typeof productFormSchema>;

export function ProductForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      categorySlug: "infused-olive-oil",
      categoryName: "Infused Olive Oil",
      imageUrl: "/products/koroneiki-evoo.svg",
      inventoryQuantity: 24,
      priceCents: 2200
    }
  });

  async function submit(values: FormValues) {
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const body = await response.json();
      alert(body.error ?? "Product could not be saved.");
      return;
    }

    reset();
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-4 rounded-md border border-olive-900/10 bg-white/60 p-5 shadow-soft">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-olive-900">
          Title
          <Input {...register("title")} placeholder="Blood Orange Infused Olive Oil" />
          {errors.title ? <span className="text-xs text-terracotta">{errors.title.message}</span> : null}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-olive-900">
          Slug
          <Input {...register("slug")} placeholder="blood-orange-infused-olive-oil" />
          {errors.slug ? <span className="text-xs text-terracotta">{errors.slug.message}</span> : null}
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-olive-900">
        Short description
        <Input {...register("shortDescription")} placeholder="Bright orange zest with a silky olive finish." />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-olive-900">
        Description
        <Textarea {...register("description")} placeholder="Describe tasting notes, source, and pairings." />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-olive-900">
          Price cents
          <Input type="number" {...register("priceCents")} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-olive-900">
          Compare cents
          <Input type="number" {...register("compareAtCents")} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-olive-900">
          Inventory
          <Input type="number" {...register("inventoryQuantity")} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold text-olive-900">
          Category
          <Input {...register("categoryName")} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-olive-900">
          Category slug
          <Input {...register("categorySlug")} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-olive-900">
          Flavor
          <Input {...register("flavor")} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-olive-900">
          Size
          <Input {...register("size")} />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-olive-900">
        Image URL
        <Input {...register("imageUrl")} />
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold text-olive-900">
        <input type="checkbox" className="size-4 accent-olive-700" {...register("isFeatured")} />
        Featured carousel product
      </label>
      <Button type="submit" disabled={isSubmitting}>
        <Save className="size-4" />
        Save Product
      </Button>
    </form>
  );
}
