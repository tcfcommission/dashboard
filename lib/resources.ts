type ResourceConfig = { fields: string[]; required: string[] };

export const resourceConfigs = {
  tasks: {
    fields: ["title", "details", "status", "priority", "due_date", "completed_at"],
    required: ["title"]
  },
  goals: {
    fields: ["name", "current_value", "target_value", "unit", "due_date", "status", "auto_source"],
    required: ["name", "target_value"]
  },
  socials: {
    fields: ["platform", "handle", "profile_url", "followers", "views", "engagement_rate", "growth", "source"],
    required: ["platform", "handle"]
  },
  businesses: {
    fields: ["name", "emoji", "source", "currency", "external_account_id", "is_active"],
    required: ["name"]
  },
  transactions: {
    fields: ["business_id", "provider", "external_id", "description", "transaction_type", "gross_amount", "fee_amount", "net_amount", "currency", "occurred_at", "metadata"],
    required: ["provider", "occurred_at"]
  },
  integrations: {
    fields: ["provider", "label", "status", "account_reference", "config", "sync_frequency_minutes", "is_enabled", "next_sync_at"],
    required: ["provider", "label"]
  },
  automation_rules: {
    fields: ["name", "trigger_type", "action_type", "config", "is_enabled"],
    required: ["name", "trigger_type", "action_type"]
  }
} satisfies Record<string, ResourceConfig>;

export type ResourceName = keyof typeof resourceConfigs;

export function isResourceName(resource: string): resource is ResourceName {
  return resource in resourceConfigs;
}

const forbiddenSecretKey = /(secret|password|private.?key|access.?token|refresh.?token|api.?key)/i;

function containsSecret(value: unknown, key = ""): boolean {
  if (forbiddenSecretKey.test(key)) return true;
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(([childKey, child]) => containsSecret(child, childKey));
}

export function sanitizeResource(resource: string, body: unknown, partial = false) {
  if (!isResourceName(resource)) throw new Error("Unsupported resource.");
  const config = resourceConfigs[resource];
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid request body.");

  const input = body as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  config.fields.forEach((field) => {
    if (field in input) output[field] = input[field];
  });

  if (!partial) {
    config.required.forEach((field) => {
      if (output[field] === undefined || output[field] === null || output[field] === "") {
        throw new Error(`${field} is required.`);
      }
    });
  }

  if (["integrations", "automation_rules"].includes(resource) && containsSecret(output.config)) {
    throw new Error("Do not store API keys, passwords, or tokens in integration configuration. Use a TCF_* Vercel environment-variable reference.");
  }

  return output;
}

export function isSafeCredentialReference(value: unknown): value is string {
  return typeof value === "string" && /^TCF_[A-Z0-9_]+$/.test(value);
}
