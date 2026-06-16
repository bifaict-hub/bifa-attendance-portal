-- ================================================================
-- BIFA ATTENDANCE PORTAL - DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor
-- ================================================================

-- 1. CREATE TABLES
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text DEFAULT 'lecturer',
  department text DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS groups (
  id text PRIMARY KEY,
  name text NOT NULL,
  department text NOT NULL,
  year int NOT NULL,
  term int NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS units (
  id text PRIMARY KEY,
  name text NOT NULL,
  group_id text REFERENCES groups(id) ON DELETE CASCADE,
  sessions_per_day int DEFAULT 1,
  lecturer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reg_no text UNIQUE NOT NULL,
  name text NOT NULL,
  group_id text REFERENCES groups(id) ON DELETE SET NULL,
  department text NOT NULL,
  year int DEFAULT 1,
  term int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  unit_id text REFERENCES units(id) ON DELETE CASCADE,
  date date NOT NULL,
  session int DEFAULT 1,
  week_num int,
  present boolean NOT NULL,
  marked_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, unit_id, date, session)
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- 2. DISABLE ROW LEVEL SECURITY (allows anon key to read/write)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- 3. SEED ADMIN ACCOUNTS
INSERT INTO users (name, email, password, role, active) VALUES
  ('Meja (Admin)', 'meja@gmail.com', 'admin123', 'admin', true),
  ('Dean', 'dean@gmail.com', 'dean123', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- 4. SEED GROUPS
INSERT INTO groups (id, name, department, year, term) VALUES
  ('g1','Level 6 Graphic','Graphic Design',3,1),
  ('g2','Level 5 Modular May 26 (Graphic)','Graphic Design',1,1),
  ('g3','Level 6 Modular May 26 (Graphic)','Graphic Design',1,1),
  ('g4','Level 6 Modular Jan 26 (Graphic)','Graphic Design',1,1),
  ('g5','Level 5 Modular Jan 26 (Graphic)','Graphic Design',1,1),
  ('g6','KNEC May 2025 (Graphic)','Graphic Design',2,1),
  ('g7','NITA (Graphic)','Graphic Design',1,1),
  ('g8','Level 4 Modular May 26 (Interior) T1','Interior Design',1,1),
  ('g9','Level 5 Modular May 26 (Interior)','Interior Design',1,1),
  ('g10','Level 6 Modular May 26 (Interior)','Interior Design',1,1),
  ('g11','Level 4 Modular May 26 (Interior) T2','Interior Design',1,2),
  ('g12','Level 6 May 25 (Interior)','Interior Design',1,1),
  ('g13','Level 6 Interior','Interior Design',3,1),
  ('g14','Level 6 Fine Arts','Fine Arts',3,1),
  ('g15','Level 5 Modular May 26 (Fine Arts)','Fine Arts',1,1),
  ('g16','KNEC May 2025 (Fine Arts)','Fine Arts',2,1),
  ('g17','Level 5 Modular Jan 26 (Fine Arts)','Fine Arts',1,1),
  ('g18','Level 4 Mod 1 May 26 (Fashion)','Fashion Design',1,1),
  ('g19','Level 5 Mod 1 May 26 (Fashion)','Fashion Design',1,1),
  ('g20','Level 5 Mod 2 May 26 (Fashion)','Fashion Design',1,1),
  ('g21','Level 6 Mod 2 May 24 (Fashion)','Fashion Design',3,1),
  ('g22','KNEC Mod 2 May 2025 (Fashion)','Fashion Design',2,2)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED UNITS
INSERT INTO units (id, name, group_id, sessions_per_day) VALUES
  ('u1','Environment','g1',1),('u2','Packaging Design','g1',1),('u3','Graphic Reproduction','g1',1),
  ('u4','Publication Design','g1',1),('u5','UI Design','g1',1),('u6','Photography','g1',1),
  ('u7','OSHA','g1',1),('u8','Graphic Illustration','g1',2),
  ('u9','Christian Ethics','g2',1),('u10','Hand Drawing','g2',2),('u11','Digital Literacy','g2',2),
  ('u12','Elements','g2',1),('u13','Conceptualize','g2',2),('u14','Digital Graphics','g2',3),
  ('u15','Christian Ethics','g3',1),('u16','Hand Drawing','g3',2),('u17','Digital Literacy','g3',2),
  ('u18','Elements','g3',1),('u19','Conceptualize','g3',2),('u20','Digital Graphics','g3',3),
  ('u21','Christian Ethics','g4',1),('u22','Elements','g4',2),('u23','Conceptualize','g4',2),
  ('u24','Hand Drawing','g4',2),('u25','Digital Literacy','g4',2),('u26','Digital Graphics','g4',1),
  ('u27','Christian Ethics','g5',1),('u28','Elements','g5',2),('u29','Conceptualize','g5',2),
  ('u30','Hand Drawing','g5',2),('u31','Digital Literacy','g5',2),('u32','Digital Graphics','g5',1),
  ('u33','Entrepreneurship','g6',1),('u34','S/MGT','g6',1),('u35','Graphic Reproduction','g6',1),
  ('u36','Art & Design','g6',1),('u37','Typography','g6',1),('u38','Packaging','g6',1),
  ('u39','Advertising','g6',1),('u40','CAD','g6',1),('u41','Research Methods','g6',1),
  ('u42','Publications','g6',1),('u43','IMM','g6',1),('u44','CID','g6',1),
  ('u45','Social Studies','g6',1),('u46','Visual Communication','g6',1),
  ('u47','Design Principles','g7',1),('u48','Packaging','g7',1),('u49','Science & Basic Maths','g7',1),
  ('u50','Communication Skills','g7',1),('u51','Lettering','g7',1),('u52','Digital Graphics','g7',1),
  ('u53','Digital Literacy','g7',1),('u54','Hand Drawing','g7',1),('u55','Workplace Safety','g7',1),
  ('u56','Life Skills','g7',1),
  ('u57','Christian Ethics','g8',1),('u58','Free Hand Drawing','g8',1),('u59','Colour Theory','g8',2),('u60','Fundamentals','g8',3),
  ('u61','Christian Ethics','g9',1),('u62','Free Hand Drawing','g9',1),('u63','Colour Theory','g9',2),('u64','Fundamentals','g9',3),
  ('u65','Christian Ethics','g10',1),('u66','Free Hand Drawing','g10',1),('u67','Colour Theory','g10',2),('u68','Fundamentals','g10',3),
  ('u69','Christian Ethics','g11',1),('u70','Technical Drawing','g11',2),('u71','Model Making','g11',3),('u72','Finishing','g11',2),
  ('u73','T.O','g12',2),('u74','Furniture','g12',2),('u75','Manage Projects','g12',1),
  ('u76','Materials Science','g12',1),('u77','Costing','g12',1),('u78','Lighting','g12',1),
  ('u79','Entrepreneurship','g12',1),('u80','C.A.D','g12',1),
  ('u81','Environment','g13',1),('u82','Building','g13',1),('u83','ICT','g13',1),
  ('u84','Acoustic','g13',1),('u85','Finishing','g13',1),('u86','Fittings','g13',1),
  ('u87','OSHA','g13',1),('u88','C.A.D','g13',1),
  ('u89','Environment','g14',1),('u90','Execute Artworks','g14',1),('u91','Photography','g14',1),
  ('u92','Carry Out','g14',1),('u93','OSHA','g14',1),('u94','MMC','g14',2),
  ('u95','Christian Ethics','g15',1),('u96','Digital Literacy','g15',1),('u97','Elements','g15',3),
  ('u98','Modular Drawing','g15',3),('u99','3D Shape','g15',2),
  ('u100','Entrepreneurship','g16',1),('u101','S/MGT','g16',1),('u102','Graphic Reproduction','g16',1),
  ('u103','Art & Design','g16',1),('u104','Typography','g16',1),('u105','Visual Communication','g16',1),
  ('u106','DSHIP','g16',1),('u107','CAD','g16',1),('u108','Research Methods','g16',1),
  ('u109','MMC','g16',1),('u110','Painting Art','g16',1),('u111','Drawing','g16',1),('u112','Social Studies','g16',1),
  ('u113','Christian Ethics','g17',1),('u114','Digital Literacy','g17',2),('u115','Elements','g17',2),
  ('u116','3D Shapes','g17',2),('u117','Free Hand Drawing','g17',1),
  ('u118','Basic Gents','g18',1),('u119','Sewing Machine','g18',1),('u120','Basic Ladies','g18',1),('u121','Basic G/L Illustration','g18',1),
  ('u122','Basic Gents','g19',1),('u123','Sewing Machine','g19',1),('u124','Basic Ladies','g19',1),('u125','Basic G/L Illustration','g19',1),
  ('u126','Christian Ethics','g20',1),('u127','SG Pattern','g20',1),('u128','Deco Fab Tie Dye','g20',1),
  ('u129','Deco Fab Printing','g20',1),('u130','SG Gents','g20',1),('u131','SG Ladies','g20',1),
  ('u132','SG Illustration','g20',1),('u133','SG Pattern Construction','g20',1),
  ('u134','Environmental','g21',1),('u135','Des Con Bridal','g21',1),('u136','Pattern Con & Drafting','g21',1),
  ('u137','Pattern Grading','g21',1),('u138','Des Con Millinary','g21',1),('u139','Des Con Lingerie','g21',1),
  ('u140','Des Con Sports','g21',1),('u141','Des Con Shoes','g21',1),('u142','Textile','g21',1),('u143','Occupational','g21',1),
  ('u144','Trade Project','g22',1),('u145','CCT','g22',1),('u146','Cloth Construction','g22',1),
  ('u147','Pattern Grading','g22',1),('u148','Pattern Drafting','g22',1),('u149','QC','g22',1),
  ('u150','CAD','g22',1),('u151','Fashion Marketing','g22',1),('u152','Fashion Accessories','g22',1),('u153','IDM','g22',1)
ON CONFLICT (id) DO NOTHING;
