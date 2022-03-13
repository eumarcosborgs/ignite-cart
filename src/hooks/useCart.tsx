import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)

      const foundProduct = cart.find(product => product.id === productId)

      const amount = (foundProduct?.amount || 0) +1

      if (amount <= stock.amount) {
        if (foundProduct) {
          const products = cart.map(
            product => product.id === productId ? {...product, amount: amount +1} : product
          )
  
          setCart(products)
  
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
        } else {
          const { data: product } = await api.get<Product>(`/products/${productId}`)
  
          product.amount = 1
  
          const products = [...cart, product]
 
          setCart(products)

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
        }
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch (error) {
      toast.error('Ocorreu um erro ao adicionar mais produtos')
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const products = cart.find(product => product.id === productId)

      if (!products) {
        toast.error('Error ao remover o produto')
        return
      }

      const listWithProductRemoved = cart.filter(product => product.id !== productId)

      setCart(listWithProductRemoved)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(listWithProductRemoved))
    } catch {
      toast.error('Ocorreu um erro ao remover o produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)

      const foundProduct = cart.find(product => product.id === productId)

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada ultrapassa nosso estoque')
        return
      }

      if (foundProduct) {
        const products = cart.map(product => product.id === productId ? {...product, amount} : product)

        setCart(products)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
      } else {
        toast.error('Erro na adição do produto');
      }
    } catch {
      toast.error('Erro ao atualizar a quantidade de produtos');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
