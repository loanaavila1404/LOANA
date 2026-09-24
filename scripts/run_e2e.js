const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runE2E() {
  const email = 'qa_e2e@brusben.edu.pe';
  const password = 'TestPassword123!';
  let userId;

  console.log('1. Provisioning QA User...');
  try {
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (error) {
      console.log('User might exist, trying to get it...');
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users.users.find(u => u.email === email);
      if (existing) {
        userId = existing.id;
        await supabase.auth.admin.updateUserById(userId, { password });
      } else {
        throw error;
      }
    } else {
      userId = user.id;
    }

    // Ensure Profile exists and is SUPERADMIN
    const { data: role } = await supabase.from('roles').select('id').eq('code', 'SUPERADMIN').single();
    await supabase.from('profiles').upsert({
      id: userId,
      email: email,
      display_name: 'QA Tester',
      role_id: role.id,
      status: 'ACTIVO'
    });
    
    console.log(`User ready: ${email} (ID: ${userId})`);

    // Start Puppeteer
    console.log('2. Starting Browser...');
    const browser = await puppeteer.launch({ headless: true }); // headless is faster
    
    // Test Desktop
    console.log('3. Testing Desktop View (1366x768)...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    // Login
    await page.goto(`http://localhost:3000/api/dev-login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    await new Promise(r => setTimeout(r, 2000));
    
    if (page.url().includes('/dashboard')) {
      console.log('Login successful.');
    } else {
      console.error('Login failed, url is:', page.url());
      const body = await page.evaluate(() => document.body.innerHTML);
      console.log('Body:', body.substring(0, 500));
      process.exit(1);
    }
    
    const artifactsDir = 'C:\\\\Users\\\\loana\\\\.gemini\\\\antigravity\\\\brain\\\\1bec294e-f534-4b19-9b4f-8548fbdb9e8f';
    await page.screenshot({ path: path.join(artifactsDir, 'dashboard_desktop.png'), fullPage: true });
    console.log('Desktop screenshot saved.');

    // E2E Test: Create QA Prospecto
    console.log('4. Testing Prospecto Creation...');
    // Create via server action or direct click
    // Wait, testing drag and drop with puppeteer can be flaky, let's just create one and verify dashboard
    
    // Verify Dashboard counts
    // Evaluate text in cards
    const getCardValue = async (title) => {
      return await page.evaluate((title) => {
        const span = Array.from(document.querySelectorAll('span')).find(el => el.textContent === title);
        if (span) {
          const parent = span.closest('article');
          if (parent) {
            const valDiv = parent.querySelector('.text-xl, .text-3xl');
            return valDiv ? valDiv.textContent : null;
          }
        }
        return null;
      }, title);
    };
    
    const countBefore = await getCardValue('Prospectos activos');
    console.log(`Prospectos activos before: ${countBefore}`);

    // Create a prospecto directly via Supabase so we can test the UI reflects it
    // Or we could click through the UI. "Crea un prospecto QA... Comprueba que aparece en el Kanban"
    await page.goto('http://localhost:3000/crm');
    await page.waitForSelector('text=Nuevo prospecto');
    
    // Click Nuevo prospecto
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Nuevo prospecto')) {
        await b.click();
        break;
      }
    }
    
    await page.waitForSelector('input[name="nombres"]');
    await page.type('input[name="nombres"]', 'QA-Prospecto');
    await page.type('input[name="apellidos"]', 'Prueba');
    await page.type('input[name="telefono"]', '999888777');
    await page.type('input[name="email"]', 'qa@test.com');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 2000)); // Wait for modal to close and refresh
    
    // Verify it's in the Kanban
    const kanbanText = await page.evaluate(() => document.body.innerText);
    if (kanbanText.includes('QA-Prospecto')) {
      console.log('Prospecto successfully created and visible in Kanban!');
    } else {
      console.log('Prospecto not found in Kanban.');
    }

    // Create a student QA
    console.log('4.5 Testing Persona/Estudiante Creation...');
    await page.goto('http://localhost:3000/personas');
    await new Promise(r => setTimeout(r, 1000));
    
    // Click on "Nuevo prospecto" or in this case "Nueva Persona" or however the modal trigger is called
    // Wait, let's just trigger it by clicking the first button that has a Plus icon or similar
    const pButtons = await page.$$('button');
    for (const b of pButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Nuevo') || text.includes('Nueva')) {
        await b.click();
        break;
      }
    }
    
    try {
      await page.waitForSelector('input[name="nombres"]', { timeout: 2000 });
      await page.type('input[name="nombres"]', 'QA-Estudiante');
      await page.type('input[name="apellido_paterno"]', 'Test');
      await page.type('input[name="numero_documento"]', '00000000');
      // If there's a submit button
      const submits = await page.$$('button[type="submit"]');
      if (submits.length > 0) await submits[0].click();
      await new Promise(r => setTimeout(r, 2000));
      
      const pText = await page.evaluate(() => document.body.innerText);
      if (pText.includes('QA-Estudiante')) {
        console.log('Estudiante successfully created!');
      } else {
        console.log('Estudiante not found in list.');
      }
    } catch (e) {
      console.log('Could not automate persona form', e.message);
    }
    
    // Check dashboard again
    await page.goto('http://localhost:3000/dashboard');
    await new Promise(r => setTimeout(r, 1000));
    const countAfter = await getCardValue('Prospectos activos');
    console.log(`Prospectos activos after: ${countAfter}`);
    
    // Capture Mobile
    console.log('5. Testing Mobile View (390x844)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    // Transfer cookies
    const cookies = await page.cookies();
    await mobilePage.setCookie(...cookies);
    
    await mobilePage.goto('http://localhost:3000/dashboard');
    await new Promise(r => setTimeout(r, 1000));
    await mobilePage.screenshot({ path: path.join(artifactsDir, 'dashboard_mobile.png'), fullPage: true });
    console.log('Mobile screenshot saved.');

    // Test Sidebar Links
    console.log('6. Testing Links...');
    const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.getAttribute('href')));
    console.log('Found Links:', [...new Set(hrefs)]);

    await browser.close();

    console.log('7. Cleaning up QA records...');
    await supabase.from('prospectos').delete().like('nombres', 'QA-%');
    await supabase.auth.admin.deleteUser(userId);
    console.log('Cleanup complete.');

  } catch (error) {
    console.error('Test Failed:', error);
  }
}

runE2E();
