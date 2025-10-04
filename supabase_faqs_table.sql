-- =====================================================
-- TABLA FAQS (PREGUNTAS FRECUENTES)
-- =====================================================
-- Ejecutar este comando en el SQL Editor de Supabase
-- =====================================================

-- Crear tabla de FAQs
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para optimización
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_is_active ON faqs(is_active);
CREATE INDEX idx_faqs_order_index ON faqs(order_index);

-- Datos de ejemplo (opcional)
INSERT INTO faqs (question, answer, category, is_active, order_index) VALUES 
('¿Cuáles son los horarios de atención?', 'Nuestros horarios de atención son de lunes a viernes de 9:00 AM a 6:00 PM y sábados de 10:00 AM a 4:00 PM.', 'general', true, 1),
('¿Ofrecen garantía en sus productos?', 'Sí, todos nuestros productos cuentan con garantía de 6 meses contra defectos de fabricación.', 'productos', true, 1),
('¿Cuánto tiempo tardan en entregar un pedido?', 'Los pedidos se entregan entre 3-5 días hábiles dentro de la ciudad y 7-10 días hábiles a nivel nacional.', 'pedidos', true, 1),
('¿Qué métodos de pago aceptan?', 'Aceptamos efectivo, tarjetas de crédito/débito, transferencias bancarias y pagos móviles.', 'pagos', true, 1),
('¿Cómo debo cuidar mis joyas de plata?', 'Para mantener tus joyas de plata en buen estado, límpialas regularmente con un paño suave y guárdalas en un lugar seco.', 'cuidados', true, 1);

-- =====================================================
-- FIN DEL SCRIPT DE FAQs
-- =====================================================