const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function run() {
  await supabase.from('prospectos').insert({
    codigo: 'PRO-QA-01',
    nombres: 'QA-Prospecto',
    apellidos: 'Prueba',
    telefono: '999888777',
    email: 'qa.prospecto@test.com',
    status: 'NUEVO'
  });
  console.log('Prospecto created.');
}
run();
