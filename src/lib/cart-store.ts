// Centralized cart store with persistence & event dispatch
// Provides robust add/update/remove operations without race conditions.

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  variant?: string;
}

interface CartState {
  items: CartItem[];
  loaded: boolean; // indicates localStorage has been read
}

type Listener = (state: CartState) => void;

const LS_KEY = 'absv-cart';

class CartStore {
  private state: CartState = { items: [], loaded: false };
  private listeners: Set<Listener> = new Set();
  private loading = false;
  private storageBound = false;

  private persist() {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(LS_KEY, JSON.stringify(this.state.items));
    } catch {}
  }

  private emit() {
    const snapshot = { ...this.state, items: [...this.state.items] };
    this.listeners.forEach(l => l(snapshot));
    // Dispatch cart-state event for badge
    try {
      const count = snapshot.items.reduce((acc, i) => acc + i.qty, 0);
      window.dispatchEvent(new CustomEvent('cart-state', { detail: { count } }));
    } catch {}
  }

  loadOnce() {
    if (this.state.loaded || this.loading) return;
    this.loading = true;
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.state.items = parsed.filter(i => i && i.id && typeof i.qty === 'number');
        }
      }
    } catch {}
    this.state.loaded = true;
    this.loading = false;
    this.emit();
    // Attach storage sync once (multi-tab)
    if (typeof window !== 'undefined' && !this.storageBound) {
      window.addEventListener('storage', (e) => {
        if (e.key === LS_KEY) {
          try {
            const raw = e.newValue;
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                this.state.items = parsed.filter(i => i && i.id && typeof i.qty === 'number');
                this.emit();
              }
            } else {
              this.state.items = [];
              this.emit();
            }
          } catch {}
        }
      });
      this.storageBound = true;
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    // push current state
    listener({ ...this.state, items: [...this.state.items] });
    return () => this.listeners.delete(listener);
  }

  addItem(partial: Omit<CartItem, 'qty'> & { qty?: number }) {
    this.loadOnce();
    const qty = partial.qty && partial.qty > 0 ? partial.qty : 1;
    const existing = this.state.items.find(i => i.id === partial.id);
    if (existing) existing.qty += qty; else this.state.items.push({ ...partial, qty });
    this.persist();
    this.emit();
  }

  updateQty(id: string, qty: number) {
    this.loadOnce();
    if (qty < 1) return;
    const item = this.state.items.find(i => i.id === id);
    if (!item) return;
    item.qty = qty;
    this.persist();
    this.emit();
  }

  remove(id: string) {
    this.loadOnce();
    this.state.items = this.state.items.filter(i => i.id !== id);
    this.persist();
    this.emit();
  }

  clear() {
    this.state.items = [];
    this.persist();
    this.emit();
  }

  getItems() {
    this.loadOnce();
    return [...this.state.items];
  }
}

export const cartStore = new CartStore();

// Convenience helper for UI
export function clearCart() {
  cartStore.clear();
}
