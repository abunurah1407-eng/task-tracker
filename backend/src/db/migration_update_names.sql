-- Migration Script: Update Names to Full Names and Emails to Lowercase
-- Run this script on your production database to update existing data
-- This script is safe to run multiple times (idempotent)

-- Step 1: Update engineers table (short names to full names)
UPDATE engineers SET name = 'Faisal AlAmmaj' WHERE name = 'Faisal';
UPDATE engineers SET name = 'Abeer M. Al-Osaimi' WHERE name = 'Abeer';
UPDATE engineers SET name = 'Mohammed AlShahrani' WHERE name = 'M. Shahrani';
UPDATE engineers SET name = 'Wed N Alrashed' WHERE name = 'Wed';
UPDATE engineers SET name = 'Sultan Aldossari' WHERE name = 'S. Dossari';
UPDATE engineers SET name = 'Abdullah T. Al-Faleh' WHERE name = 'Abdullah';
UPDATE engineers SET name = 'Milaf S. Al-Sahli' WHERE name = 'Milaf';
UPDATE engineers SET name = 'Mohammed Ageeli' WHERE name = 'M. Aqily';
UPDATE engineers SET name = 'Ghaida AlOmair' WHERE name = 'Ghaida';
UPDATE engineers SET name = 'Amani AL-Swailem' WHERE name = 'Amani';
UPDATE engineers SET name = 'Menwer AlShammari' WHERE name = 'Menwer';
UPDATE engineers SET name = 'Abdulrahman Alderwish' WHERE name = 'A. Driwesh';
UPDATE engineers SET name = 'Aryam Al-Ahmari' WHERE name = 'Aryam';

-- Step 2: Update users table (names, engineer_name, and emails to lowercase)
UPDATE users SET 
    name = 'Faisal AlAmmaj',
    engineer_name = 'Faisal AlAmmaj',
    email = LOWER(email)
WHERE email = 'f.ammaj@etec.gov.sa' OR email = 'F.Ammaj@etec.gov.sa';

UPDATE users SET 
    name = 'Abeer M. Al-Osaimi',
    engineer_name = 'Abeer M. Al-Osaimi',
    email = LOWER(email)
WHERE email = 'a.osaimi@etec.gov.sa' OR email = 'A.Osaimi@etec.gov.sa';

UPDATE users SET 
    name = 'Mohammed AlShahrani',
    engineer_name = 'Mohammed AlShahrani',
    email = LOWER(email)
WHERE email = 'm.shahrani@etec.gov.sa' OR email = 'M.Shahrani@etec.gov.sa';

UPDATE users SET 
    name = 'Wed N Alrashed',
    engineer_name = 'Wed N Alrashed',
    email = LOWER(email)
WHERE email = 'w.rashed@etec.gov.sa' OR email = 'W.rashed@etec.gov.sa';

UPDATE users SET 
    name = 'Sultan Aldossari',
    engineer_name = 'Sultan Aldossari',
    email = LOWER(email)
WHERE email = 's.dossari@etec.gov.sa' OR email = 'S.Dossari@etec.gov.sa';

UPDATE users SET 
    name = 'Abdullah T. Al-Faleh',
    engineer_name = 'Abdullah T. Al-Faleh',
    email = LOWER(email)
WHERE email = 'a.tfaleh@etec.gov.sa' OR email = 'A.Tfaleh@etec.gov.sa';

UPDATE users SET 
    name = 'Milaf S. Al-Sahli',
    engineer_name = 'Milaf S. Al-Sahli',
    email = LOWER(email)
WHERE email = 'm.sahli@etec.gov.sa' OR email = 'M.Sahli@etec.gov.sa';

UPDATE users SET 
    name = 'Mohammed Ageeli',
    engineer_name = 'Mohammed Ageeli',
    email = LOWER(email)
WHERE email = 'm.ageeli@etec.gov.sa' OR email = 'M.Ageeli@etec.gov.sa';

UPDATE users SET 
    name = 'Ghaida AlOmair',
    engineer_name = 'Ghaida AlOmair',
    email = LOWER(email)
WHERE email = 'g.omair@etec.gov.sa' OR email = 'G.Omair@etec.gov.sa';

UPDATE users SET 
    name = 'Amani AL-Swailem',
    engineer_name = 'Amani AL-Swailem',
    email = LOWER(email)
WHERE email = 'a.nswailem@etec.gov.sa' OR email = 'A.Nswailem@etec.gov.sa';

UPDATE users SET 
    name = 'Menwer AlShammari',
    engineer_name = 'Menwer AlShammari',
    email = LOWER(email)
WHERE email = 'm.hshammari@etec.gov.sa' OR email = 'M.Hshammari@etec.gov.sa';

UPDATE users SET 
    name = 'Abdulrahman Alderwish',
    engineer_name = 'Abdulrahman Alderwish',
    email = LOWER(email)
WHERE email = 'a.derwish@etec.gov.sa' OR email = 'A.Derwish@etec.gov.sa';

UPDATE users SET 
    name = 'Aryam Al-Ahmari',
    engineer_name = 'Aryam Al-Ahmari',
    email = LOWER(email)
WHERE email = 'a.aaahmari@etec.gov.sa' OR email = 'A.AAAhmari@etec.gov.sa';

-- Update director email to lowercase
UPDATE users SET email = LOWER(email) WHERE email = 'N.Saleem@etec.gov.sa';

-- Step 3: Update services table (assigned_to field)
UPDATE services SET assigned_to = 'Faisal AlAmmaj' WHERE assigned_to = 'Faisal';
UPDATE services SET assigned_to = 'Abeer M. Al-Osaimi' WHERE assigned_to = 'Abeer';
UPDATE services SET assigned_to = 'Mohammed AlShahrani' WHERE assigned_to = 'M. Shahrani';
UPDATE services SET assigned_to = 'Wed N Alrashed' WHERE assigned_to = 'Wed';
UPDATE services SET assigned_to = 'Sultan Aldossari' WHERE assigned_to = 'S. Dossari';
UPDATE services SET assigned_to = 'Abdullah T. Al-Faleh' WHERE assigned_to = 'Abdullah';
UPDATE services SET assigned_to = 'Milaf S. Al-Sahli' WHERE assigned_to = 'Milaf';
UPDATE services SET assigned_to = 'Mohammed Ageeli' WHERE assigned_to = 'M. Aqily';
UPDATE services SET assigned_to = 'Ghaida AlOmair' WHERE assigned_to = 'Ghaida';
UPDATE services SET assigned_to = 'Amani AL-Swailem' WHERE assigned_to = 'Amani';
UPDATE services SET assigned_to = 'Menwer AlShammari' WHERE assigned_to = 'Menwer';
UPDATE services SET assigned_to = 'Abdulrahman Alderwish' WHERE assigned_to = 'A. Driwesh';
UPDATE services SET assigned_to = 'Aryam Al-Ahmari' WHERE assigned_to = 'Aryam';

-- Step 4: Update tasks table (engineer field)
UPDATE tasks SET engineer = 'Faisal AlAmmaj' WHERE engineer = 'Faisal';
UPDATE tasks SET engineer = 'Abeer M. Al-Osaimi' WHERE engineer = 'Abeer';
UPDATE tasks SET engineer = 'Mohammed AlShahrani' WHERE engineer = 'M. Shahrani';
UPDATE tasks SET engineer = 'Wed N Alrashed' WHERE engineer = 'Wed';
UPDATE tasks SET engineer = 'Sultan Aldossari' WHERE engineer = 'S. Dossari';
UPDATE tasks SET engineer = 'Abdullah T. Al-Faleh' WHERE engineer = 'Abdullah';
UPDATE tasks SET engineer = 'Milaf S. Al-Sahli' WHERE engineer = 'Milaf';
UPDATE tasks SET engineer = 'Mohammed Ageeli' WHERE engineer = 'M. Aqily';
UPDATE tasks SET engineer = 'Ghaida AlOmair' WHERE engineer = 'Ghaida';
UPDATE tasks SET engineer = 'Amani AL-Swailem' WHERE engineer = 'Amani';
UPDATE tasks SET engineer = 'Menwer AlShammari' WHERE engineer = 'Menwer';
UPDATE tasks SET engineer = 'Abdulrahman Alderwish' WHERE engineer = 'A. Driwesh';
UPDATE tasks SET engineer = 'Aryam Al-Ahmari' WHERE engineer = 'Aryam';

-- Verification queries (run these to check the updates)
-- SELECT name FROM engineers ORDER BY name;
-- SELECT email, name, engineer_name FROM users WHERE role = 'engineer' ORDER BY name;
-- SELECT name, assigned_to FROM services WHERE assigned_to IS NOT NULL ORDER BY assigned_to;

