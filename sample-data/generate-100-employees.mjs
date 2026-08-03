import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ALL_SKILLS = [
  "Java", "Python", "JavaScript", "TypeScript", "React", "Angular", "Vue",
  "Node.js", "Spring Boot", "Express", "Django", "Flask", "PostgreSQL",
  "MySQL", "MongoDB", "Oracle", "AWS", "Azure", "GCP", "Docker",
  "Kubernetes", "Git", "HTML", "CSS", "C++", "C#", "Ruby", "PHP",
  "Go", "Rust", "Swift", "Kotlin", "Scala"
];

const DEPARTMENTS = ['Software Engineering', 'Cloud & Infra', 'Data', 'QA', 'Design', 'AI', 'Delivery'];
const LOCATIONS = ['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai', 'Delhi', 'Noida', 'Kolkata', 'Indore', 'Surat'];
const DESIGNATIONS = [
  'Backend Developer', 'Frontend Developer', 'Full Stack Developer',
  'DevOps Engineer', 'Data Engineer', 'AI Engineer', 'Software Engineer',
  'Cloud Engineer', 'QA Engineer', 'UI/UX Designer', 'Mobile Developer'
];
const PROFICIENCY = ['Entry Level', 'Intermediate', 'Advanced', 'Expert'];
const STATUSES = ['ON_BENCH', 'ON_BENCH', 'ON_BENCH', 'SHORTLISTED', 'ALLOCATED'];

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Rahul', 'Priya', 'Vikram', 'Neha', 'Arjun', 'Kavya', 'Rohan', 'Ananya',
  'Karan', 'Isha', 'Dev', 'Meera', 'Sanjay', 'Pooja', 'Nikhil', 'Divya', 'Amit', 'Sneha',
  'Varun', 'Ritu', 'Manish', 'Shreya', 'Gaurav', 'Tanvi', 'Harsh', 'Nidhi', 'Yash', 'Simran',
  'Akash', 'Deepa', 'Rajesh', 'Lakshmi', 'Suresh', 'Anjali', 'Pranav', 'Bhavna', 'Kunal', 'Swati',
  'Mohit', 'Preeti', 'Abhishek', 'Kriti', 'Siddharth', 'Palak', 'Tarun', 'Nisha', 'Vivek', 'Aisha',
  'Anil', 'Roshni', 'Sameer', 'Tanya', 'Rohit', 'Divyansh', 'Priya', 'Kiran', 'Ishan', 'Alok'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Mehta', 'Reddy', 'Iyer', 'Gupta', 'Singh', 'Nair', 'Joshi', 'Desai',
  'Kapoor', 'Malhotra', 'Verma', 'Chopra', 'Bose', 'Menon', 'Rao', 'Kulkarni', 'Agarwal', 'Pillai',
  'Saxena', 'Banerjee', 'Mishra', 'Dubey', 'Tiwari', 'Chauhan', 'Yadav', 'Pandey', 'Shah', 'Khanna',
  'Bhatt', 'Thakur', 'Shetty', 'Naidu', 'Gowda', 'Krishnan', 'Subramanian', 'Chatterjee', 'Das', 'Roy',
  'Sinha', 'Bhatia', 'Arora', 'Grover', 'Sood', 'Tandon', 'Wadhwa', 'Lal', 'Bajaj', 'Sethi'
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSkills(count) {
  const shuffled = [...ALL_SKILLS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDate(startYear = 2018, endYear = 2024) {
  const year = getRandomInt(startYear, endYear);
  const month = String(getRandomInt(1, 12)).padStart(2, '0');
  const day = String(getRandomInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const headers = [
  'role', 'employeeCode', 'firstName', 'lastName', 'email', 'phoneNumber',
  'location', 'department', 'designation', 'joiningDate', 'experienceYears',
  'managerId', 'status', 
  'skill1Name', 'skill1Proficiency', 'skill1SelfRating', 'skill1Date',
  'skill2Name', 'skill2Proficiency', 'skill2SelfRating', 'skill2Date',
  'skill3Name', 'skill3Proficiency', 'skill3SelfRating', 'skill3Date',
  'defaultPassword'
];

const rows = [headers.join(',')];
const usedEmails = new Set();
const usedCodes = new Set();

for (let i = 0; i < 100; i += 1) {
  const fn = getRandomItem(FIRST_NAMES);
  const ln = getRandomItem(LAST_NAMES);
  
  let empCodeNum = getRandomInt(100000, 999999);
  while (usedCodes.has(empCodeNum)) {
    empCodeNum = getRandomInt(100000, 999999);
  }
  usedCodes.add(empCodeNum);
  const employeeCode = `EMPLOYEE-${empCodeNum}`;

  let emailBase = `${fn.toLowerCase()}.${ln.toLowerCase()}${getRandomInt(1, 999)}@gmail.com`;
  while (usedEmails.has(emailBase)) {
    emailBase = `${fn.toLowerCase()}.${ln.toLowerCase()}${getRandomInt(1000, 9999)}@gmail.com`;
  }
  usedEmails.add(emailBase);

  // Generate unique passwords
  const password = `${fn.toLowerCase()}${getRandomInt(100, 999)}`;

  // Random skills count: 1, 2, or 3
  const randVal = Math.random();
  const skillCount = randVal < 0.3 ? 1 : (randVal < 0.7 ? 2 : 3);
  const selectedSkills = getRandomSkills(skillCount);

  const phone = `98${getRandomInt(10000000, 99999999)}`;
  const expYears = getRandomInt(1, 12).toString();

  const row = [
    'EMPLOYEE',
    employeeCode,
    fn,
    ln,
    emailBase,
    phone,
    getRandomItem(LOCATIONS),
    getRandomItem(DEPARTMENTS),
    getRandomItem(DESIGNATIONS),
    getRandomDate(2017, 2023),
    expYears,
    getRandomItem(['7020', '2002', '6015', '2005', '2001', '']),
    getRandomItem(STATUSES),
  ];

  for (let s = 0; s < 3; s += 1) {
    if (s < selectedSkills.length) {
      row.push(
        selectedSkills[s],
        getRandomItem(PROFICIENCY),
        getRandomInt(1, 10),
        getRandomDate(2019, 2024)
      );
    } else {
      row.push('', '', '', '');
    }
  }

  row.push(password);

  rows.push(row.map(csvEscape).join(','));
}

const outputPath = join(__dirname, 'employees-100-generated.csv');
writeFileSync(outputPath, `${rows.join('\n')}\n`, 'utf8');
console.log(`Successfully generated 100 employees CSV at: ${outputPath}`);
