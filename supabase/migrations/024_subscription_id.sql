-- TipTop Pay recurrent subscriptions: store the gateway subscription ID
-- (comes in Pay notifications as SubscriptionId) so we can cancel auto-renewal
-- via the TipTop API and match recurring charges to their subscription.
alter table subscriptions
  add column if not exists subscription_id text;

create index if not exists subscriptions_subscription_id_idx
  on subscriptions (subscription_id)
  where subscription_id is not null;
