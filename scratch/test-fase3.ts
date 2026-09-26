import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPersonas() {
  console.log("Creando persona de prueba...");
  const { data: nuevaPersona, error: errInsert } = await supabase.from("personas").insert({
    nombres: "Test",
    apellido_paterno: "Persona",
    tipo_documento: "DNI",
    numero_documento: "99999999",
    email: "test@brusben.edu.pe",
    status: "ACTIVO"
  }).select("id").single();

  if (errInsert) {
    console.error("Error al crear:", errInsert);
    return;
  }
  console.log("Persona creada:", nuevaPersona.id);

  console.log("Convirtiendo a estudiante...");
  const { error: errConv } = await supabase.from("estudiantes").insert({
    persona_id: nuevaPersona.id,
    codigo_estudiante: "TEST-001",
    status: "ACTIVO"
  });

  if (errConv) {
    console.error("Error al convertir:", errConv);
  } else {
    console.log("Convertido exitosamente.");
  }

  console.log("Eliminando registros de prueba...");
  await supabase.from("estudiantes").delete().eq("persona_id", nuevaPersona.id);
  await supabase.from("personas").delete().eq("id", nuevaPersona.id);
  console.log("Limpieza terminada.");
}

testPersonas();
