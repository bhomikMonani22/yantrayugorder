/**
 * Seed script for Shrinath Ji Enterprises ordering platform.
 *
 * Creates:
 *   - 1 distributor (Shrinath Ji Enterprises)
 *   - 1 admin user, 2 retailer users (auth users + profiles)
 *   - ~30 parts across HERO / HONDA / SUZUKI / TVS
 *
 * Run AFTER applying migration 0001_init.sql.
 *
 *   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  node supabase/seed.mjs
 *
 * Needs: npm i @supabase/supabase-js   (or run from an app dir that has it)
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  { email: 'admin@shrinathji.test',    password: 'Admin@12345',    role: 'admin',
    shop_name: 'Shrinath Ji HQ',        contact_name: 'Admin',         city: 'Pune' },
  { email: 'retailer1@shrinathji.test', password: 'Retail@12345',   role: 'retailer',
    shop_name: 'Balaji Auto Spares',    contact_name: 'Suresh',  phone: '9890011223',
    gstin: '27ABCDE1234F1Z5',           city: 'Pune' },
  { email: 'retailer2@shrinathji.test', password: 'Retail@12345',   role: 'retailer',
    shop_name: 'Mahalaxmi Motor Parts', contact_name: 'Ramesh', phone: '9822033445',
    gstin: '27FGHIJ5678K1Z2',           city: 'Pimpri-Chinchwad' },
  // A warehouse operator for the fulfilment desk.
  { email: 'warehouse@shrinathji.test', password: 'Wh@12345',       role: 'warehouse',
    shop_name: 'Main Warehouse',        contact_name: 'Store Desk',    city: 'Pune' },
];

// Realistic-format part numbers across the 4 brands.
const PARTS = [
  // HERO
  ['45010KTP901S', 'BRAKE PAD SET FRONT - SPLENDOR',          'HERO',   532.00, 1,  'A-01-03'],
  ['35010AAEH00S', 'HANDLE SWITCH ASSY RH - PASSION',         'HERO',   418.00, 1,  'A-02-11'],
  ['52400KCC900S', 'SHOCK ABSORBER REAR - HF DELUXE',         'HERO',   1185.00,1,  'B-04-02'],
  ['28011KRMJ00S', 'KICK STARTER SPINDLE - GLAMOUR',          'HERO',   276.00, 2,  'A-03-07'],
  ['91201KCJ900S', 'OIL SEAL CRANKCASE - SUPER SPLENDOR',     'HERO',    64.00, 5,  'C-01-09'],
  ['14710KWF900S', 'CAMSHAFT ASSY - XTREME 160R',             'HERO',   1640.00,1,  'B-02-05'],
  ['23100KCJ900S', 'CLUTCH PLATE SET - PASSION PRO',          'HERO',   388.00, 1,  'A-05-01'],
  ['31100KFG900S', 'FLYWHEEL MAGNETO ASSY - SPLENDOR+',       'HERO',   1920.00,1,  'B-06-03'],
  ['44650KSS901S', 'WHEEL RIM REAR - HF DELUXE',              'HERO',   1340.00,1,  'B-01-12'],
  ['18310KTM900S', 'SILENCER ASSY - GLAMOUR 125',             'HERO',   2150.00,1,  'B-07-08'],

  // HONDA
  ['06430KVB900', 'BRAKE SHOE SET - ACTIVA',                  'HONDA',  365.00, 1,  'D-01-04'],
  ['31100KVB901', 'FLYWHEEL COMP - ACTIVA 5G',                'HONDA',  1875.00,1,  'D-02-06'],
  ['17210KVB900', 'AIR FILTER ELEMENT - DIO',                 'HONDA',  198.00, 2,  'D-03-02'],
  ['23100KWN900', 'V-BELT DRIVE - ACTIVA 6G',                 'HONDA',  720.00, 1,  'D-01-09'],
  ['44650KWN901', 'WHEEL FRONT - DIO',                        'HONDA',  1560.00,1,  'D-04-01'],
  ['35010K0J900', 'COMBINATION SWITCH - SHINE',               'HONDA',  445.00, 1,  'D-02-10'],
  ['91051KVB900', 'BEARING RADIAL BALL - ACTIVA',             'HONDA',   92.00, 5,  'E-01-03'],
  ['13010KWN900', 'PISTON RING SET STD - UNICORN',            'HONDA',  410.00, 1,  'E-02-07'],

  // SUZUKI
  ['09262200340', 'BEARING - ACCESS 125',                     'SUZUKI',  88.00, 5,  'F-01-02'],
  ['1740041820',  'AIR CLEANER ASSY - GIXXER',                'SUZUKI',  640.00, 1,  'F-02-04'],
  ['5910041850',  'BRAKE PAD SET - GIXXER SF',                'SUZUKI',  560.00, 1,  'F-01-08'],
  ['2740041811',  'DRIVE BELT - ACCESS 125',                  'SUZUKI',  690.00, 1,  'F-03-01'],
  ['3340041810',  'IGNITION COIL ASSY - BURGMAN',             'SUZUKI', 1120.00,1,  'F-02-09'],
  ['1280041820',  'CAMSHAFT - GIXXER 250',                    'SUZUKI', 1780.00,1,  'F-04-03'],
  ['5110041840',  'FRONT FORK ASSY RH - ACCESS',              'SUZUKI', 1980.00,1,  'F-05-05'],

  // TVS
  ['N3211010',    'BRAKE SHOE - APACHE RTR 160',              'TVS',    298.00, 1,  'G-01-01'],
  ['T3540020',    'CLUTCH ASSY - JUPITER',                    'TVS',    1340.00,1,  'G-02-03'],
  ['H1822030',    'CDI UNIT - NTORQ 125',                     'TVS',    980.00, 1,  'G-03-06'],
  ['K4465040',    'WHEEL REAR - APACHE RTR 200',              'TVS',    1720.00,1,  'G-04-02'],
  ['P1731050',    'AIR FILTER - RAIDER 125',                  'TVS',    230.00, 2,  'G-01-07'],
  ['R9105060',    'OIL SEAL KIT - STAR CITY',                 'TVS',    115.00, 5,  'G-05-04'],
];

async function findOrCreateUser(u) {
  // Try to create; if already exists, look it up.
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });
  if (data?.user) return data.user.id;

  if (error && /already/i.test(error.message)) {
    const { data: list } = await admin.auth.admin.listUsers();
    const found = list.users.find((x) => x.email === u.email);
    if (found) return found.id;
  }
  throw error || new Error(`Could not create/find ${u.email}`);
}

async function main() {
  console.log('→ Upserting distributor…');
  // One canonical distributor by name.
  let { data: dist } = await admin
    .from('sj_distributors').select('*').eq('name', 'Shrinath Ji Enterprises').maybeSingle();
  if (!dist) {
    const ins = await admin.from('sj_distributors')
      .insert({ name: 'Shrinath Ji Enterprises' }).select().single();
    if (ins.error) throw ins.error;
    dist = ins.data;
  }
  console.log('   distributor_id =', dist.id);

  console.log('→ Creating users + profiles…');
  for (const u of USERS) {
    const uid = await findOrCreateUser(u);
    const { error } = await admin.from('sj_profiles').upsert({
      id: uid,
      distributor_id: dist.id,
      role: u.role,
      shop_name: u.shop_name ?? null,
      contact_name: u.contact_name ?? null,
      phone: u.phone ?? null,
      gstin: u.gstin ?? null,
      city: u.city ?? null,
    });
    if (error) throw error;
    console.log(`   ${u.role.padEnd(9)} ${u.email}  (pw: ${u.password})`);
  }

  console.log('→ Inserting parts…');
  const rows = PARTS.map(([part_no, description, brand, mrp, moq, bin_location]) => ({
    distributor_id: dist.id, part_no, description, brand, mrp, moq, bin_location,
  }));
  const { error: pErr } = await admin
    .from('sj_parts')
    .upsert(rows, { onConflict: 'distributor_id,part_no' });
  if (pErr) throw pErr;
  console.log(`   ${rows.length} parts seeded.`);

  console.log('\n✅ Seed complete.\n');
  console.log('Login credentials:');
  for (const u of USERS) console.log(`  ${u.role.padEnd(9)} ${u.email}  /  ${u.password}`);
}

main().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
