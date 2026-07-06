import { ShoppingBag, Trash2, Plus, Minus, CreditCard, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckoutModal } from '@/components/CheckoutModal';

export function CartDrawer() {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    cartTotal, 
    cartCount,
    addToCart,
    setIsCheckoutOpen,
  } = useStore();
  const { isLoading } = useAuth();

  const handleQuantityChange = (item: typeof cart[0], delta: number) => {
    if (delta > 0) {
      addToCart(item);
    } else if (item.quantity > 1) {
      // For decreasing quantity, we'll remove and re-add with lower quantity
      removeFromCart(item.id);
      for (let i = 0; i < item.quantity - 1; i++) {
        addToCart(item);
      }
    } else {
      removeFromCart(item.id);
    }
  };

  return (
    <>
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md bg-[#1a1510] border-l border-amber-900/30">
          <SheetHeader className="border-b border-amber-900/20 pb-4">
            <SheetTitle className="flex items-center gap-2 text-amber-100">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              Your Cart ({cartCount})
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-20 h-20 rounded-full bg-amber-900/20 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-amber-100/30" />
              </div>
              <p className="text-amber-100/60 mb-2">Your cart is empty</p>
              <p className="text-amber-100/40 text-sm">Start adding some records!</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[calc(100vh-280px)] mt-4">
                <div className="space-y-4 pr-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3 bg-amber-900/10 rounded-xl border border-amber-900/20"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-amber-100 truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-amber-100/60 mb-2">{item.artist}</p>
                        <p className="text-lg font-bold text-amber-400">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-amber-100/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item, -1)}
                            className="w-6 h-6 rounded bg-amber-900/30 flex items-center justify-center text-amber-100/60 hover:bg-amber-900/50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm text-amber-100 w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item, 1)}
                            className="w-6 h-6 rounded bg-amber-900/30 flex items-center justify-center text-amber-100/60 hover:bg-amber-900/50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-amber-900/20 bg-[#1a1510]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-amber-100/60">Subtotal</span>
                  <span className="text-2xl font-bold text-amber-400">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <Button
                  className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-[#1a1510] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verificando sesión...</>
                  ) : (
                    <><CreditCard className="w-4 h-4" /> Proceed to Checkout</>
                  )}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de checkout con pasarela de pago */}
      <CheckoutModal />
    </>
  );
}
