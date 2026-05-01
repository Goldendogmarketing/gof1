import { aristonJsonFeedAdapter } from "@/lib/product-feed/adapters/ariston-json";
import { demoProductFeedAdapter } from "@/lib/product-feed/adapters/demo";
import { woocommerceProductFeedAdapter } from "@/lib/product-feed/adapters/woocommerce";
import type { ProductFeedAdapter } from "@/lib/product-feed/types";

export function getProductFeedAdapter(): ProductFeedAdapter {
  const adapter =
    process.env.PRODUCT_FEED_ADAPTER ??
    (process.env.WOOCOMMERCE_STORE_URL ? "woocommerce" : process.env.PRODUCT_FEED_URL ? "ariston-json" : "demo");

  if (adapter === "woocommerce") return woocommerceProductFeedAdapter();
  if (adapter === "ariston-json") return aristonJsonFeedAdapter();
  return demoProductFeedAdapter;
}
