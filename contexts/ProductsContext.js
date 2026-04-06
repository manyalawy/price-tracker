import { createContext, useContext, useReducer, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ProductsContext = createContext({});

const initialState = {
  products: [],
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products] };
    case 'REMOVE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p),
      };
    default:
      return state;
  }
}

export function ProductsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING' });
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      dispatch({ type: 'SET_PRODUCTS', payload: data || [] });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [user]);

  const addProduct = async (productData) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        url: productData.url,
        name: productData.name,
        image_url: productData.image_url,
        domain: productData.domain,
        current_price: productData.price,
        target_price: productData.target_price,
        currency: productData.currency || 'USD',
        highest_price: productData.price,
        lowest_price: productData.price,
        last_checked_at: new Date().toISOString(),
        extraction_method: productData.method,
        extraction_selector: productData.selector,
      })
      .select()
      .single();

    if (error) throw error;

    // Also insert initial price history
    await supabase.from('price_history').insert({
      product_id: data.id,
      price: productData.price,
    });

    dispatch({ type: 'ADD_PRODUCT', payload: data });
    return data;
  };

  const deleteProduct = async (productId) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) throw error;
    dispatch({ type: 'REMOVE_PRODUCT', payload: productId });
  };

  const updateTargetPrice = async (productId, newTarget) => {
    const { error } = await supabase
      .from('products')
      .update({ target_price: newTarget, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) throw error;
    dispatch({ type: 'UPDATE_PRODUCT', payload: { id: productId, target_price: newTarget } });
  };

  return (
    <ProductsContext.Provider value={{ ...state, fetchProducts, addProduct, deleteProduct, updateTargetPrice }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
