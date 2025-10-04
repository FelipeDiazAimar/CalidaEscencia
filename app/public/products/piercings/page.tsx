import { redirect } from 'next/navigation';

export default function PiercingsPage() {
  redirect('/products?category=piercings');
}