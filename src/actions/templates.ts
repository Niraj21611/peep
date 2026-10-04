"use server";

import { revalidatePath } from "next/cache";
import { templateSchema } from "@/lib/validations/template";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplatesByUserId,
} from "@/lib/db/templates";
import { requireUser } from "@/lib/auth/session";
import { ActionResponse } from "@/types";

export async function createTemplateAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const rawName = formData.get("name");
    const rawType = formData.get("type");
    const rawCategoryId = formData.get("categoryId");
    const rawAmountInput = formData.get("amountInput") || formData.get("amount");
    const rawAmountExpression = formData.get("amountExpression");
    const rawNotes = formData.get("notes");

    const validation = templateSchema.safeParse({
      name: rawName,
      type: rawType,
      categoryId: rawCategoryId,
      amountInput: rawAmountInput,
      amountExpression: rawAmountExpression,
      notes: rawNotes,
    });

    if (!validation.success) {
      return {
        success: false,
        message: "Please fix the validation errors below.",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const template = await createTemplate({
      userId: user.id,
      name: validation.data.name,
      type: validation.data.type,
      categoryId: validation.data.categoryId,
      amount: validation.data.amount,
      amountExpression: validation.data.amountExpression,
      notes: validation.data.notes,
    });

    revalidatePath("/templates");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Template created successfully.",
      data: template,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create template.",
    };
  }
}

export async function updateTemplateAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const rawName = formData.get("name");
    const rawType = formData.get("type");
    const rawCategoryId = formData.get("categoryId");
    const rawAmountInput = formData.get("amountInput") || formData.get("amount");
    const rawAmountExpression = formData.get("amountExpression");
    const rawNotes = formData.get("notes");

    const validation = templateSchema.safeParse({
      name: rawName,
      type: rawType,
      categoryId: rawCategoryId,
      amountInput: rawAmountInput,
      amountExpression: rawAmountExpression,
      notes: rawNotes,
    });

    if (!validation.success) {
      return {
        success: false,
        message: "Please fix the validation errors below.",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const updated = await updateTemplate(id, user.id, {
      name: validation.data.name,
      type: validation.data.type,
      categoryId: validation.data.categoryId,
      amount: validation.data.amount,
      amountExpression: validation.data.amountExpression,
      notes: validation.data.notes,
    });

    revalidatePath("/templates");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Template updated successfully.",
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update template.",
    };
  }
}

export async function deleteTemplateAction(id: string): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    await deleteTemplate(id, user.id);

    revalidatePath("/templates");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Template deleted successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete template.",
    };
  }
}

export async function getUserTemplatesAction() {
  try {
    const user = await requireUser();
    const templates = await getTemplatesByUserId(user.id);
    return { success: true, data: templates };
  } catch (error) {
    return { success: false, data: [] };
  }
}
