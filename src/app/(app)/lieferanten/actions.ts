"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supplierRepo } from "@/lib/suppliers/repo";
import { SUPPLIER_FIELDS, supplierInput, type SupplierField, type SupplierFormValues } from "@/lib/suppliers/schema";

export type SupplierFormState = {
  values?: Partial<SupplierFormValues>;
  fieldErrors?: Partial<Record<SupplierField, string>>;
  formError?: string;
};

function readForm(formData: FormData): SupplierFormValues {
  return Object.fromEntries(
    SUPPLIER_FIELDS.map((f) => [f, String(formData.get(f) ?? "")]),
  ) as SupplierFormValues;
}

const idSchema = z.coerce.number().int().positive();

async function save(id: number | null, formData: FormData): Promise<SupplierFormState> {
  const user = await requireUser();
  const values = readForm(formData);
  const parsed = supplierInput.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: SupplierFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as SupplierField;
      fieldErrors[field] ??= issue.message;
    }
    return { values, fieldErrors };
  }

  const who = user.email ?? user.name;
  try {
    if (id === null) {
      await supplierRepo().create(parsed.data, who);
    } else if (!(await supplierRepo().update(id, parsed.data, who))) {
      return { values, formError: "Der Lieferant existiert nicht mehr." };
    }
  } catch (err) {
    console.error("Lieferant speichern fehlgeschlagen", err);
    return { values, formError: "Speichern fehlgeschlagen. Bitte in einem Moment erneut versuchen." };
  }

  revalidatePath("/lieferanten");
  redirect("/lieferanten?saved=1");
}

export async function createSupplier(_prev: SupplierFormState, formData: FormData) {
  return save(null, formData);
}

export async function updateSupplier(id: number, _prev: SupplierFormState, formData: FormData) {
  return save(idSchema.parse(id), formData);
}

export async function deleteSupplier(id: number): Promise<{ error?: string }> {
  await requireUser();
  try {
    await supplierRepo().remove(idSchema.parse(id));
  } catch (err) {
    console.error("Lieferant löschen fehlgeschlagen", err);
    return { error: "Löschen fehlgeschlagen. Bitte erneut versuchen." };
  }
  revalidatePath("/lieferanten");
  return {};
}
