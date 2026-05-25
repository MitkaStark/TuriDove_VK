import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CartHospedaje,
  CartActividad,
  CartTransfer,
  CartVehiculo,
} from '@/types';

type CartItemType = 'hospedajes' | 'actividades' | 'transfers' | 'vehiculos';

type CartItemMap = {
  hospedajes: CartHospedaje;
  actividades: CartActividad;
  transfers: CartTransfer;
  vehiculos: CartVehiculo;
};

interface CartState {
  items: {
    hospedajes: CartHospedaje[];
    actividades: CartActividad[];
    transfers: CartTransfer[];
    vehiculos: CartVehiculo[];
  };
  addItem: <T extends CartItemType>(type: T, item: CartItemMap[T]) => void;
  removeItem: (type: CartItemType, index: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

const emptyItems = {
  hospedajes: [] as CartHospedaje[],
  actividades: [] as CartActividad[],
  transfers: [] as CartTransfer[],
  vehiculos: [] as CartVehiculo[],
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: { ...emptyItems },

      addItem: (type, item) => {
        set((state) => ({
          items: {
            ...state.items,
            [type]: [...state.items[type], item],
          },
        }));
      },

      removeItem: (type, index) => {
        set((state) => ({
          items: {
            ...state.items,
            [type]: state.items[type].filter((_, i) => i !== index),
          },
        }));
      },

      clearCart: () => {
        set({ items: { ...emptyItems } });
      },

      getTotal: () => {
        const { items } = get();
        const sum = (arr: { precioTotal: number }[]) =>
          arr.reduce((acc, item) => acc + item.precioTotal, 0);
        return (
          sum(items.hospedajes) +
          sum(items.actividades) +
          sum(items.transfers) +
          sum(items.vehiculos)
        );
      },
    }),
    {
      name: 'cart-storage',
    },
  ),
);
