import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CreditCard, Smartphone, Building2,
  Check, AlertCircle, Loader2, ChevronRight, Lock, ShoppingBag
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/hooks/useAuth';
import { initiatePayment, pollPaymentStatus } from '@/lib/paymentApi';
import type { PaymentResponse, PaymentMethod } from '@/lib/paymentApi';

// ─── Types ──────────────────────────────────────────────────────────────────

type CheckoutStep = 'summary' | 'payment' | 'processing' | 'result';



// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function getCardBrand(number: string): 'visa' | 'mastercard' | 'amex' | 'unknown' {
  const n = number.replace(/\s/g, '');
  if (n.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return 'unknown';
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function CreditCardVisual({ number, holder, expiry, isFlipped }: {
  number: string; holder: string; expiry: string; isFlipped: boolean;
}) {
  const brand = getCardBrand(number);
  const displayNumber = number || '•••• •••• •••• ••••';
  const displayHolder = holder || 'NOMBRE DEL TITULAR';
  const displayExpiry = expiry || 'MM/AA';

  return (
    <div className="perspective-1000 w-full max-w-[320px] mx-auto h-[180px] mb-6">
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Frente */}
        <div
          className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #92400e 0%, #78350f 40%, #451a03 100%)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(251,191,36,0.2)',
          }}
        >
          {/* Chip + Marca */}
          <div className="flex justify-between items-start">
            <div className="w-10 h-7 bg-amber-400/80 rounded-md flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5 w-6 h-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-amber-600/60 rounded-sm" />
                ))}
              </div>
            </div>
            <div className="text-right">
              {brand === 'visa' && (
                <span className="text-white font-black italic text-xl tracking-tighter">VISA</span>
              )}
              {brand === 'mastercard' && (
                <div className="flex gap-[-4px]">
                  <div className="w-6 h-6 rounded-full bg-red-500 opacity-90" />
                  <div className="w-6 h-6 rounded-full bg-amber-400 opacity-90 -ml-2" />
                </div>
              )}
              {brand === 'unknown' && (
                <CreditCard className="w-6 h-6 text-amber-400/60" />
              )}
            </div>
          </div>

          {/* Número */}
          <p className="text-white font-mono text-lg tracking-widest">
            {displayNumber}
          </p>

          {/* Holder y Expiry */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-amber-400/60 text-[10px] uppercase mb-0.5">Titular</p>
              <p className="text-white text-sm font-medium truncate max-w-[180px] uppercase">
                {displayHolder}
              </p>
            </div>
            <div className="text-right">
              <p className="text-amber-400/60 text-[10px] uppercase mb-0.5">Expira</p>
              <p className="text-white text-sm font-mono">{displayExpiry}</p>
            </div>
          </div>
        </div>

        {/* Reverso */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          <div className="w-full h-10 bg-stone-900 mt-6" />
          <div className="px-5 mt-4">
            <div className="bg-amber-100/10 rounded px-3 py-2 flex justify-end">
              <p className="text-white font-mono text-sm">•••</p>
            </div>
            <p className="text-amber-400/40 text-[10px] mt-2 text-center">
              CVV — No compartas este número
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StepIndicator({ current }: { current: CheckoutStep }) {
  const steps = [
    { id: 'summary', label: 'Resumen' },
    { id: 'payment', label: 'Pago' },
    { id: 'result', label: 'Resultado' },
  ];
  const activeIndex = steps.findIndex(s =>
    s.id === current || (current === 'processing' && s.id === 'result')
  );

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 transition-all duration-300 ${
            index <= activeIndex ? 'opacity-100' : 'opacity-40'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              index < activeIndex
                ? 'bg-amber-500 text-[#1a1510]'
                : index === activeIndex
                  ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                  : 'bg-amber-900/30 text-amber-900/60'
            }`}>
              {index < activeIndex ? <Check className="w-3 h-3" /> : index + 1}
            </div>
            <span className={`text-xs ${index === activeIndex ? 'text-amber-300' : 'text-amber-100/40'}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 h-px transition-colors ${
              index < activeIndex ? 'bg-amber-500' : 'bg-amber-900/30'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CheckoutModal() {
  const { isCheckoutOpen, setIsCheckoutOpen, cart, cartTotal, clearCart } = useStore();
  const { user, isLoading } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('summary');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Limpiar estado al cerrar
  const handleClose = () => {
    setIsCheckoutOpen(false);
    setTimeout(() => {
      setStep('summary');
      setPaymentMethod('CARD');
      setCardNumber('');
      setCardHolder('');
      setExpiryMonth('');
      setExpiryYear('');
      setCvv('');
      setPaymentResult(null);
      setError(null);
      setOrderId(null);
      setShippingAddress('');
    }, 300);
  };

  // ─── Paso 1 → 2: Resumen → Pago ──────────────────────────────────────────

  const handleProceedToPayment = async () => {
    if (!shippingAddress.trim()) {
      setError('Por favor ingresa una dirección de envío');
      return;
    }
    // Si la sesión aún se está restaurando, esperar
    if (isLoading) {
      setError('Verificando tu sesión, intenta de nuevo en un momento...');
      return;
    }
    if (!user) {
      setError('Debes iniciar sesión para continuar');
      return;
    }
    setError(null);

    // Sincronizar el carrito local con el backend
    try {
      // 1. Vaciar el carrito en el backend
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/cart`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // 2. Agregar los ítems del carrito local al backend
      for (const item of cart) {
        const addItemRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            productId: parseInt(item.id, 10),
            quantity: item.quantity,
          }),
        });
        if (!addItemRes.ok) {
          const errJson = await addItemRes.json();
          throw new Error(errJson.message || 'Error al agregar productos al carrito del servidor');
        }
      }
    } catch (e: any) {
      setError(e.message || 'No se pudo sincronizar el carrito con el servidor');
      return;
    }

    // Crear la orden en el backend primero
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ shippingAddress }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al crear la orden');
      setOrderId(json.data.orderId);
      setStep('payment');
    } catch (e: any) {
      setError(e.message || 'No se pudo crear la orden. ¿El carrito está vacío?');
    }
  };

  // ─── Paso 2 → 3: Pago → Procesando ──────────────────────────────────────

  const handleSubmitPayment = async () => {
    if (!user || !orderId) return;
    setError(null);

    // Validar campos de tarjeta
    if (paymentMethod === 'CARD') {
      if (!cardNumber.replace(/\s/g, '') || cardNumber.replace(/\s/g, '').length < 16) {
        setError('Ingresa un número de tarjeta válido');
        return;
      }
      if (!cardHolder.trim()) {
        setError('Ingresa el nombre del titular');
        return;
      }
      if (!expiryMonth || !expiryYear) {
        setError('Ingresa la fecha de expiración');
        return;
      }
      if (!cvv || cvv.length < 3) {
        setError('Ingresa el CVV');
        return;
      }
    }

    setStep('processing');

    try {
      // Iniciar el pago → RabbitMQ empieza a procesar
      const initial = await initiatePayment({
        orderId,
        paymentMethod,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardHolder: cardHolder || undefined,
        expiryMonth: expiryMonth ? parseInt(expiryMonth) : undefined,
        expiryYear: expiryYear ? parseInt(expiryYear) : undefined,
        cvv: cvv || undefined,
      }, user.token);

      // Hacer polling hasta que el Consumer resuelva el pago
      const final = await pollPaymentStatus(
        initial.transactionId,
        user.token,
        (update) => setPaymentResult(update)
      );

      setPaymentResult(final);

      // Si fue aprobado, limpiar el carrito local
      if (final.status === 'APPROVED') {
        clearCart();
      }
    } catch (e: any) {
      setPaymentResult(null);
      setError(e.message || 'Error al procesar el pago');
    } finally {
      setStep('result');
    }
  };

  if (!isCheckoutOpen) return null;

  // Si la sesión aún se está restaurando al montar el modal, mostrar spinner
  if (isLoading) {
    return (
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="relative w-full max-w-lg pointer-events-auto rounded-2xl border border-amber-900/30 p-12 flex flex-col items-center gap-4"
                style={{ background: 'linear-gradient(160deg, #1f1a14 0%, #1a1510 60%, #120f0a 100%)' }}
              >
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                <p className="text-amber-100/60 text-sm">Verificando tu sesión...</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto rounded-2xl border border-amber-900/30 shadow-2xl"
              style={{
                background: 'linear-gradient(160deg, #1f1a14 0%, #1a1510 60%, #120f0a 100%)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(251,191,36,0.08)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-amber-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-amber-100 font-semibold text-lg">Checkout Seguro</h2>
                    <p className="text-amber-100/40 text-xs">Simulación de pasarela de pago</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg bg-amber-900/20 flex items-center justify-center text-amber-100/50 hover:text-amber-100 hover:bg-amber-900/40 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Steps indicator */}
              <div className="pt-5 px-6">
                <StepIndicator current={step} />
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">

                  {/* ─── STEP 1: Resumen ────────────────────────────────── */}
                  {step === 'summary' && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <h3 className="text-amber-100 font-semibold mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-amber-500" />
                        Resumen del pedido
                      </h3>

                      {/* Items */}
                      <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto pr-1">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2.5 bg-amber-900/10 rounded-xl border border-amber-900/20">
                            <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-amber-100 text-sm font-medium truncate">{item.title}</p>
                              <p className="text-amber-100/50 text-xs">{item.artist} · x{item.quantity}</p>
                            </div>
                            <span className="text-amber-400 font-semibold text-sm">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-center py-3 border-t border-amber-900/20 mb-4">
                        <span className="text-amber-100/60">Total a pagar</span>
                        <span className="text-2xl font-bold text-amber-400">${cartTotal.toFixed(2)}</span>
                      </div>

                      {/* Dirección de envío */}
                      <div className="mb-4">
                        <label className="text-amber-100/70 text-sm mb-1.5 block">Dirección de envío *</label>
                        <textarea
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Calle 123 #45-67, Bogotá, Colombia"
                          className="w-full bg-amber-900/10 border border-amber-900/30 rounded-xl p-3 text-amber-100 placeholder:text-amber-100/25 text-sm resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
                          rows={2}
                        />
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm mb-3 bg-red-900/20 rounded-lg p-3">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {error}
                        </div>
                      )}

                      <button
                        onClick={handleProceedToPayment}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-[#1a1510] font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        Continuar al pago <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* ─── STEP 2: Formulario de pago ─────────────────────── */}
                  {step === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      {/* Selector de método */}
                      <div className="flex gap-2 mb-5">
                        {([
                          { id: 'CARD', icon: CreditCard, label: 'Tarjeta' },
                          { id: 'PSE', icon: Building2, label: 'PSE' },
                          { id: 'NEQUI', icon: Smartphone, label: 'Nequi' },
                        ] as const).map(({ id, icon: Icon, label }) => (
                          <button
                            key={id}
                            onClick={() => setPaymentMethod(id)}
                            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                              paymentMethod === id
                                ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                                : 'bg-amber-900/10 border-amber-900/30 text-amber-100/50 hover:border-amber-900/60'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Tarjeta animada (solo para método CARD) */}
                      {paymentMethod === 'CARD' && (
                        <>
                          <CreditCardVisual
                            number={cardNumber}
                            holder={cardHolder}
                            expiry={expiryMonth && expiryYear ? `${expiryMonth}/${expiryYear.slice(-2)}` : ''}
                            isFlipped={isFlipped}
                          />

                          {/* Formulario tarjeta */}
                          <div className="space-y-3">
                            <div>
                              <label className="text-amber-100/60 text-xs mb-1 block">Número de tarjeta</label>
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                placeholder="4242 4242 4242 4242"
                                maxLength={19}
                                className="w-full bg-amber-900/10 border border-amber-900/30 rounded-xl px-4 py-3 text-amber-100 placeholder:text-amber-100/25 font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="text-amber-100/60 text-xs mb-1 block">Nombre del titular</label>
                              <input
                                type="text"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                placeholder="JUAN PÉREZ"
                                className="w-full bg-amber-900/10 border border-amber-900/30 rounded-xl px-4 py-3 text-amber-100 placeholder:text-amber-100/25 text-sm focus:outline-none focus:border-amber-500/50 transition-colors uppercase"
                              />
                            </div>
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="text-amber-100/60 text-xs mb-1 block">Mes / Año exp.</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={expiryMonth}
                                    onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                                    placeholder="MM"
                                    maxLength={2}
                                    className="w-full bg-amber-900/10 border border-amber-900/30 rounded-xl px-3 py-3 text-amber-100 placeholder:text-amber-100/25 font-mono text-sm text-center focus:outline-none focus:border-amber-500/50 transition-colors"
                                  />
                                  <input
                                    type="text"
                                    value={expiryYear}
                                    onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    placeholder="AAAA"
                                    maxLength={4}
                                    className="w-full bg-amber-900/10 border border-amber-900/30 rounded-xl px-3 py-3 text-amber-100 placeholder:text-amber-100/25 font-mono text-sm text-center focus:outline-none focus:border-amber-500/50 transition-colors"
                                  />
                                </div>
                              </div>
                              <div className="w-28">
                                <label className="text-amber-100/60 text-xs mb-1 block">CVV</label>
                                <input
                                  type="text"
                                  value={cvv}
                                  onFocus={() => setIsFlipped(true)}
                                  onBlur={() => setIsFlipped(false)}
                                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  placeholder="•••"
                                  maxLength={4}
                                  className="w-full bg-amber-900/10 border border-amber-900/30 rounded-xl px-3 py-3 text-amber-100 placeholder:text-amber-100/25 font-mono text-sm text-center focus:outline-none focus:border-amber-500/50 transition-colors"
                                />
                              </div>
                            </div>
                          </div>


                        </>
                      )}

                      {/* PSE / Nequi info */}
                      {(paymentMethod === 'PSE' || paymentMethod === 'NEQUI') && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3">
                            {paymentMethod === 'PSE'
                              ? <Building2 className="w-8 h-8 text-amber-400" />
                              : <Smartphone className="w-8 h-8 text-amber-400" />
                            }
                          </div>
                          <p className="text-amber-100 font-medium mb-1">
                            {paymentMethod === 'PSE' ? 'Pago por PSE' : 'Pago por Nequi'}
                          </p>
                          <p className="text-amber-100/50 text-sm">
                            {paymentMethod === 'PSE'
                              ? 'Serás redirigido a tu banco para completar el pago de forma segura.'
                              : 'Se enviará una solicitud de pago a tu número registrado en Nequi.'
                            }
                          </p>
                          <div className="mt-4 px-4 py-2 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
                            <p className="text-emerald-400 text-xs">✅ Este método siempre se aprueba en la simulación</p>
                          </div>
                        </div>
                      )}

                      {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm mt-3 bg-red-900/20 rounded-lg p-3">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {error}
                        </div>
                      )}

                      {/* Total y botón pagar */}
                      <div className="mt-5 pt-4 border-t border-amber-900/20">
                        <div className="flex justify-between mb-3">
                          <span className="text-amber-100/60 text-sm">Total</span>
                          <span className="text-amber-400 font-bold text-lg">${cartTotal.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={handleSubmitPayment}
                          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-[#1a1510] font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          Pagar ${cartTotal.toFixed(2)}
                        </button>
                        <p className="text-center text-amber-100/25 text-[11px] mt-2">
                          🔒 Transacción cifrada y procesada por RabbitMQ
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* ─── STEP 3: Procesando ──────────────────────────────── */}
                  {step === 'processing' && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-10 text-center"
                    >
                      {/* Spinner animado */}
                      <div className="relative w-24 h-24 mb-6">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                          className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 border-r-amber-500/50"
                        />
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                          className="absolute inset-2 rounded-full border-2 border-transparent border-t-amber-400/40 border-b-amber-400/40"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-amber-500" />
                        </div>
                      </div>

                      <h3 className="text-amber-100 font-semibold text-lg mb-2">
                        Procesando tu pago
                      </h3>
                      <p className="text-amber-100/50 text-sm mb-4 max-w-xs">
                        Tu solicitud fue enviada a la cola de RabbitMQ.
                        Estamos verificando con el banco...
                      </p>

                      {/* Barra de progreso animada */}
                      <div className="w-full max-w-xs bg-amber-900/20 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-amber-500 rounded-full"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        />
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-amber-100/30 text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Consultando estado del pago...
                      </div>
                    </motion.div>
                  )}

                  {/* ─── STEP 4: Resultado ──────────────────────────────── */}
                  {step === 'result' && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center text-center py-6"
                    >
                      {paymentResult?.status === 'APPROVED' ? (
                        <>
                          {/* Confetti dorado */}
                          <div className="relative">
                            {[...Array(12)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: ['#f59e0b', '#fbbf24', '#fcd34d', '#d97706'][i % 4],
                                  left: '50%',
                                  top: '50%',
                                }}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                  x: Math.cos((i / 12) * 2 * Math.PI) * 60,
                                  y: Math.sin((i / 12) * 2 * Math.PI) * 60,
                                  opacity: 0,
                                  scale: 0,
                                }}
                                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                              />
                            ))}
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                              className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30"
                            >
                              <Check className="w-10 h-10 text-emerald-400" />
                            </motion.div>
                          </div>

                          <h3 className="text-emerald-400 font-bold text-xl mb-2 mt-6">
                            ¡Pago Aprobado! 🎵
                          </h3>
                          <p className="text-amber-100/60 text-sm mb-4">
                            {paymentResult.message}
                          </p>

                          {/* Recibo */}
                          <div className="w-full bg-amber-900/10 rounded-xl border border-amber-900/20 p-4 text-left space-y-2 text-sm mb-5">
                            <div className="flex justify-between">
                              <span className="text-amber-100/50">Transacción</span>
                              <span className="text-amber-100 font-mono text-xs truncate max-w-[160px]">
                                {paymentResult.transactionId?.slice(0, 16)}...
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-100/50">Método</span>
                              <span className="text-amber-100">
                                {paymentResult.paymentMethod === 'CARD' && paymentResult.cardLastFour
                                  ? `•••• ${paymentResult.cardLastFour}`
                                  : paymentResult.paymentMethod}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-100/50">Total cobrado</span>
                              <span className="text-amber-400 font-bold">${paymentResult.amount?.toFixed(2)}</span>
                            </div>
                          </div>

                          <button
                            onClick={handleClose}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-[#1a1510] font-bold rounded-xl transition-colors"
                          >
                            Ver mis pedidos
                          </button>
                        </>
                      ) : (
                        <>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                            className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30"
                          >
                            <AlertCircle className="w-10 h-10 text-red-400" />
                          </motion.div>

                          <h3 className="text-red-400 font-bold text-xl mb-2">
                            Pago Rechazado
                          </h3>
                          <p className="text-amber-100/60 text-sm mb-5">
                            {paymentResult?.message || error || 'El pago no pudo procesarse.'}
                          </p>

                          <div className="flex gap-3 w-full">
                            <button
                              onClick={() => {
                                setStep('payment');
                                setPaymentResult(null);
                                setError(null);
                              }}
                              className="flex-1 py-3 bg-amber-900/30 hover:bg-amber-900/50 text-amber-100 font-semibold rounded-xl transition-colors border border-amber-900/40"
                            >
                              Intentar de nuevo
                            </button>
                            <button
                              onClick={handleClose}
                              className="flex-1 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold rounded-xl transition-colors border border-amber-500/20"
                            >
                              Cerrar
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
