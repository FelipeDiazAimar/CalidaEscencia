-- Create announcements table for managing announcement bar content
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX idx_announcements_order ON announcements(order_position);

-- Create index for active announcements
CREATE INDEX idx_announcements_active ON announcements(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (public can read)
CREATE POLICY "Allow read access for everyone" ON announcements
  FOR SELECT USING (true);

-- Create policy for insert/update/delete (allow all for now - you can restrict this later)
CREATE POLICY "Allow all operations for now" ON announcements
  FOR ALL USING (true);

-- Insert sample data
INSERT INTO announcements (text, is_active, order_position) VALUES
('🎉 ¡Envío gratis en compras mayores a $50! Aprovecha esta oferta especial.', true, 1),
('⭐ Nueva colección disponible - Descubre los últimos diseños', true, 2),
('📱 Síguenos en redes sociales para ofertas exclusivas', false, 3);