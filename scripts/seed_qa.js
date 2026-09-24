const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createQAData() {
  console.log('Inserting QA Prospecto and Persona...');
  
  // Create Persona
  const { data: persona, error: pErr } = await supabase.from('personas').insert({
    tipo_documento: 'DNI',
    numero_documento: '99999999',
    nombres: 'QA-Estudiante',
    apellido_paterno: 'Test',
    email: 'qa.estudiante@test.com',
    status: 'activo'
  }).select().single();
  
  if (pErr) console.error(pErr);
  
  // Create Estudiante
  const { error: eErr } = await supabase.from('estudiantes').insert({
    persona_id: persona.id,
    codigo_estudiante: 'EST-QA-01',
    status: 'ACTIVO'
  });
  
  if (eErr) console.error(eErr);
  
  const { error: prErr } = await supabase.from('prospectos').insert({
    codigo: 'PRO-QA-01',
    nombres: 'QA-Prospecto',
    apellidos: 'Prueba',
    telefono: '999888777',
    email: 'qa.prospecto@test.com',
    status: 'NUEVO'
  });
  
  if (prErr) console.error(prErr);
  
  console.log('QA data created successfully.');
}

createQAData();
