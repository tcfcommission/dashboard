import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const secretKey = process.env.TCF_STRIPE_SECRET_KEY;
  const webhookSecret = process.env.TCF_STRIPE_WEBHOOK_SECRET;
  const userId = process.env.TCF_OWNER_USER_ID;
  if (!secretKey || !webhookSecret || !userId) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  try {
    const stripe = new Stripe(secretKey);
    const event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
    const service = createServiceClient();
    const businessId = process.env.TCF_STRIPE_BUSINESS_ID || null;

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const amount = (intent.amount_received || 0) / 100;
      const { error } = await service.from("transactions").upsert({
        user_id: userId,
        business_id: businessId,
        provider: "stripe",
        external_id: intent.id,
        description: intent.description || "Stripe payment",
        transaction_type: "income",
        gross_amount: amount,
        fee_amount: 0,
        net_amount: amount,
        currency: intent.currency.toUpperCase(),
        occurred_at: new Date(intent.created * 1000).toISOString(),
        metadata: { event_id: event.id, customer: typeof intent.customer === "string" ? intent.customer : null }
      }, { onConflict: "user_id,provider,external_id" });
      if (error) throw error;
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const refunded = (charge.amount_refunded || 0) / 100;
      const { error } = await service.from("transactions").upsert({
        user_id: userId,
        business_id: businessId,
        provider: "stripe",
        external_id: event.id,
        description: charge.description || "Stripe refund",
        transaction_type: "refund",
        gross_amount: -refunded,
        fee_amount: 0,
        net_amount: -refunded,
        currency: charge.currency.toUpperCase(),
        occurred_at: new Date(event.created * 1000).toISOString(),
        metadata: { event_id: event.id, charge_id: charge.id }
      }, { onConflict: "user_id,provider,external_id" });
      if (error) throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook." }, { status: 400 });
  }
}
