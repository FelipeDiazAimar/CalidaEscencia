import { redirect } from 'next/navigation';

export default function AccesoriosPage() {
  redirect('/products?category=accesorios');
}