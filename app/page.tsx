import React from 'react'
import { supabase } from '@/utils/supabaseClient'

export default async function Page() {
  const supabaseClient = supabase();
  const { data } = await supabaseClient.from('slot_remote').select('*');

  return (
    <div>
      <h1>Supabase Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}