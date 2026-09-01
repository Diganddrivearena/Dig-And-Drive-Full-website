import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { imageFor } from "@/lib/images";
import { waLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";
import { loadRazorpay, type RazorpaySuccessResponse } from "@/lib/razorpay";
import { toast } from "sonner";

export function CartDrawer() {
  const {
    cart,
    isOpen,
    setIsOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
  } = useCart();
  const { user, signInWithGoogle } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [phone, setPhone] = useState("");

  const payable = Math.max(0, cartTotal - discount);

  const normalizedPhone = (() => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10 && /^[6-9]/.test(digits)) return digits;
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    return null;
  })();

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await api<{
        valid: boolean;
        code: string;
        discount: number;
      }>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: couponCode, cartTotal }),
      });
      setDiscount(res.discount);
      setAppliedCoupon(res.code);
      toast.success(`Coupon ${res.code} applied`);
    } catch (e) {
      setDiscount(0);
      setAppliedCoupon(null);
      toast.error(e instanceof Error ? e.message : "Invalid coupon");
    }
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;
    let message =
      "Hello DIG & DRIVE ARENA, I'd like to place an order for the following items:\n\n";
    cart.forEach((item, index) => {
      message += `*${index + 1}. ${item.product.name}* (Qty: ${item.quantity}) - ₹${(
        item.product.price * item.quantity
      ).toLocaleString("en-IN")}\n`;
    });
    if (appliedCoupon) {
      message += `\nCoupon: ${appliedCoupon} (−₹${discount.toLocaleString("en-IN")})`;
    }
    message += `\n*Total Order Value:* ₹${payable.toLocaleString("en-IN")}\n\n`;
    message += "Please coordinate payment & dispatch details. Thank you!";
    window.open(waLink(message), "_blank");
  };

  const handlePay = async () => {
    if (cart.length === 0) return;
    if (!user) {
      toast.message("Sign in to pay online");
      await signInWithGoogle("/");
      return;
    }
    if (!normalizedPhone) {
      toast.error("Enter a valid 10-digit mobile for WhatsApp order confirmation");
      return;
    }

    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Failed to load Razorpay");

      const order = await api<{
        orderId: number;
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>("/checkout/create-order", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
          couponCode: appliedCoupon || undefined,
          phone: normalizedPhone,
        }),
      });

      const rzp = new window.Razorpay({
        key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount * 100,
        currency: order.currency,
        name: "DIG & DRIVE ARENA",
        description: `Order #${order.orderId}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: normalizedPhone,
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            await api("/checkout/verify", {
              method: "POST",
              body: JSON.stringify({
                orderId: order.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            clearCart();
            setDiscount(0);
            setAppliedCoupon(null);
            setCouponCode("");
            setIsOpen(false);
            toast.success(
              "Payment successful! Order confirmation sent on WhatsApp.",
            );
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Verification failed");
          }
        },
      });

      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl border-l border-border"
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-orange" />
                <h2 className="font-display text-2xl text-brand-black">Your Cart</h2>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-brand-gray hover:text-brand-black transition-colors"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-brand-gray p-6">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl text-brand-black">Your cart is empty</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                    Browse our collection of premium RC vehicles and add machines to your cart.
                  </p>
                  <button onClick={() => setIsOpen(false)} className="btn-yellow mt-6 text-sm">
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex gap-4 rounded-xl border border-border p-3 hover:border-brand-orange/40 transition-colors"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-brand-black">
                        <img
                          src={imageFor(item.product.image)}
                          alt={item.product.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h4 className="font-display text-base text-brand-black leading-tight line-clamp-1">
                            {item.product.name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {item.product.category}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center rounded-md border border-border bg-brand-gray">
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1)
                              }
                              className="p-1.5 hover:text-brand-orange transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-brand-black">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                              }
                              className="p-1.5 hover:text-brand-orange transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="font-display text-base text-brand-black">
                            ₹
                            {(item.product.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="self-start text-muted-foreground hover:text-destructive p-1 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-border p-5 bg-brand-gray/30 space-y-3">
                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    WhatsApp mobile (order confirmation)
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm uppercase"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-brand-orange"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-green-700">
                    {appliedCoupon} applied (−₹{discount.toLocaleString("en-IN")})
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Total</span>
                  <span className="font-display text-2xl text-brand-black">
                    ₹{payable.toLocaleString("en-IN")}
                  </span>
                </div>

                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="btn-yellow w-full py-3 text-base justify-center"
                >
                  {paying ? "Processing…" : user ? "Pay with Razorpay" : "Sign in & Pay"}
                </button>
                <button
                  onClick={handleWhatsAppCheckout}
                  className="btn-whatsapp w-full py-3 text-base justify-center shadow-lg shadow-whatsapp/25"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Checkout via WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
