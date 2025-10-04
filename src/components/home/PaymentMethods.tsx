'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { CreditCard, Landmark, HandCoins } from "lucide-react";
import { productApi } from "@/lib/api";

type PaymentSectionContent = {
	title: string;
	subtitle: string;
	backgroundImage: string;
	methods: string[];
};

const DEFAULT_PAYMENT_SECTION: PaymentSectionContent = {
	title: "Métodos de Pago",
	subtitle: "Paga de forma rápida y segura.",
	backgroundImage: "https://picsum.photos/1200/400?v=63",
	methods: [
		"Tarjetas de Crédito / Débito",
		"Transferencia Bancaria",
		"Pago Contra Entrega",
	],
};

const PAYMENT_ICONS = [CreditCard, Landmark, HandCoins];

export default function PaymentMethods() {
	const [section, setSection] = useState<PaymentSectionContent>(DEFAULT_PAYMENT_SECTION);

	useEffect(() => {
		let isMounted = true;

		const loadPaymentSection = async () => {
			try {
				const response = await productApi.aboutContent.getBySection('payment');

				if (!isMounted) return;

				if (response?.data) {
					const data = response.data;
					const extraMethods = Array.isArray(data.extra_data?.methods)
						? data.extra_data.methods.filter((method: unknown): method is string => typeof method === 'string' && method.trim().length > 0)
						: [];

					setSection({
						title: data.title || DEFAULT_PAYMENT_SECTION.title,
						subtitle: data.subtitle || DEFAULT_PAYMENT_SECTION.subtitle,
						backgroundImage: data.background_image_url || data.image_url || DEFAULT_PAYMENT_SECTION.backgroundImage,
						methods: extraMethods.length > 0 ? extraMethods : DEFAULT_PAYMENT_SECTION.methods,
					});
				}
			} catch (error) {
				console.error('Error loading payment methods section:', error);
			}
		};

		loadPaymentSection();

		return () => {
			isMounted = false;
		};
	}, []);

	const backgroundImage = section.backgroundImage || DEFAULT_PAYMENT_SECTION.backgroundImage;
	const methods = section.methods.length > 0 ? section.methods : DEFAULT_PAYMENT_SECTION.methods;

	return (
		<section className="relative py-10 sm:py-16">
			<Image
				src={backgroundImage}
				alt="Fondo de métodos de pago"
				fill
				className="object-cover"
				data-ai-hint="jewelry background"
				priority
			/>
			<div className="absolute inset-0 bg-black/50" />
			<div className="container relative">
				<div className="text-center mb-8 sm:mb-12 text-white px-2">
					<h2 className="font-headline text-2xl sm:text-4xl font-bold tracking-tight">
						{section.title}
					</h2>
					<p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-lg">
						{section.subtitle}
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 text-center px-2">
					{methods.map((method, index) => {
						const Icon = PAYMENT_ICONS[index % PAYMENT_ICONS.length];
						return (
							<div
								key={`${method}-${index}`}
								className="flex flex-col items-center gap-3 sm:gap-4 p-6 sm:p-8 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
							>
								<Icon className="h-12 w-12 sm:h-16 sm:w-16 text-primary mb-1 sm:mb-2" />
								<p className="text-sm sm:text-lg font-medium text-white leading-snug">
									{method}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
