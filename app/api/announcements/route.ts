import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .order('order_position', { ascending: true });

    if (error) {
      console.error('Error fetching announcements:', error);
      return NextResponse.json({ error: 'Error fetching announcements' }, { status: 500 });
    }

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Error in announcements API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const body = await request.json();
    
    const { text, is_active = true } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Get the highest order position
    const { data: maxOrderData } = await supabase
      .from('announcements')
      .select('order_position')
      .order('order_position', { ascending: false })
      .limit(1);

    const maxOrder = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0] as any)?.order_position || 0 : 0;
    const newOrder = maxOrder + 1;

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert([{
        text: text.trim(),
        is_active,
        order_position: newOrder
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      return NextResponse.json({ error: 'Error creating announcement', details: error.message }, { status: 500 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error in POST announcements API:', error);
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
}