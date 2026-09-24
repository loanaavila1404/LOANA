const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function runE2E() {
  const email = 'qa_e2e@brusben.edu.pe';
  const password = 'TestPassword123!';
  let userId;

  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users.users.find(u => u.email === email);
    userId = existing.id;
    
    console.log('2. Starting Browser...');
    const browser = await puppeteer.launch({ headless: true });
    
    console.log('3. Testing Desktop View (1366x768)...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    try { await page.goto(`http://localhost:3000/api/dev-login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`); } catch (e) {}
    await new Promise(r => setTimeout(r, 3000)); // wait for redirect
    
    const artifactsDir = 'C:\\\\Users\\\\loana\\\\.gemini\\\\antigravity\\\\brain\\\\1bec294e-f534-4b19-9b4f-8548fbdb9e8f';
    await page.screenshot({ path: path.join(artifactsDir, 'dashboard_desktop_with_data.png'), fullPage: true });
    console.log('Desktop screenshot saved.');
    
    await page.goto('http://localhost:3000/crm');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(artifactsDir, 'crm_kanban.png'), fullPage: true });
    console.log('CRM Kanban screenshot saved.');
    
    await page.goto('http://localhost:3000/personas');
    await new Promise(r => setTimeout(r, 2000));
    // Click Nuevo Estudiante to show modal
    const pButtons = await page.$$('button');
    for (const b of pButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Nueva')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(artifactsDir, 'persona_form.png'), fullPage: true });
    
    // Mobile screenshot
    console.log('Testing Mobile View (390x844)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    const cookies = await page.cookies();
    await mobilePage.setCookie(...cookies);
    
    await mobilePage.goto('http://localhost:3000/dashboard');
    await new Promise(r => setTimeout(r, 2000));
    await mobilePage.screenshot({ path: path.join(artifactsDir, 'dashboard_mobile_with_data.png'), fullPage: true });
    console.log('Mobile screenshot saved.');
    
    await browser.close();

    console.log('7. Cleaning up QA records...');
    await supabase.from('prospectos').delete().like('nombres', 'QA-%');
    await supabase.from('estudiantes').delete().like('codigo_estudiante', 'EST-QA-%');
    await supabase.from('personas').delete().like('nombres', 'QA-%');
    await supabase.auth.admin.deleteUser(userId);
    console.log('Cleanup complete.');

  } catch (error) {
    console.error('Test Failed:', error);
  }
}

runE2E();
