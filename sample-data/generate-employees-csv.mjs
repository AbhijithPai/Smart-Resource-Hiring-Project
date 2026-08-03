import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEPARTMENTS = ['IT', 'Data', 'AI', 'Engineering', 'Delivery'];
const LOCATIONS = ['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai'];
const DESIGNATIONS = [
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Engineer',
  'AI Engineer',
  'Software Engineer',
  'Cloud Engineer',
];
const PROFICIENCY = ['Entry Level', 'Intermediate', 'Advanced'];
const STATUSES = [
  'ON_BENCH', 'ON_BENCH', 'ON_BENCH', 'ON_BENCH', 'ON_BENCH',
  'ON_BENCH', 'ON_BENCH', 'ON_BENCH', 'ON_BENCH', 'SHORTLISTED',
  'ALLOCATED',
];

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Rahul', 'Priya', 'Vikram', 'Neha', 'Arjun', 'Kavya', 'Rohan', 'Ananya',
  'Karan', 'Isha', 'Dev', 'Meera', 'Sanjay', 'Pooja', 'Nikhil', 'Divya', 'Amit', 'Sneha',
  'Varun', 'Ritu', 'Manish', 'Shreya', 'Gaurav', 'Tanvi', 'Harsh', 'Nidhi', 'Yash', 'Simran',
  'Akash', 'Deepa', 'Rajesh', 'Lakshmi', 'Suresh', 'Anjali', 'Pranav', 'Bhavna', 'Kunal', 'Swati',
  'Mohit', 'Preeti', 'Abhishek', 'Kriti', 'Siddharth', 'Palak', 'Tarun', 'Nisha', 'Vivek', 'Aisha',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Mehta', 'Reddy', 'Iyer', 'Gupta', 'Singh', 'Nair', 'Joshi', 'Desai',
  'Kapoor', 'Malhotra', 'Verma', 'Chopra', 'Bose', 'Menon', 'Rao', 'Kulkarni', 'Agarwal', 'Pillai',
  'Saxena', 'Banerjee', 'Mishra', 'Dubey', 'Tiwari', 'Chauhan', 'Yadav', 'Pandey', 'Shah', 'Khanna',
  'Bhatt', 'Thakur', 'Shetty', 'Naidu', 'Gowda', 'Krishnan', 'Subramanian', 'Chatterjee', 'Das', 'Roy',
  'Sinha', 'Bhatia', 'Arora', 'Grover', 'Sood', 'Tandon', 'Wadhwa', 'Lal', 'Bajaj', 'Sethi',
];

const SKILL_PROFILES = [
  { name: 'Java Backend', skills: ['Java', 'Spring Boot', 'MySQL', 'Git'] },
  { name: 'Java Backend', skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'] },
  { name: 'Python Full Stack', skills: ['Python', 'Django', 'PostgreSQL', 'React'] },
  { name: 'Python Data', skills: ['Python', 'Flask', 'PostgreSQL', 'AWS'] },
  { name: 'React Frontend', skills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS'] },
  { name: 'Angular Frontend', skills: ['Angular', 'TypeScript', 'JavaScript', 'HTML'] },
  { name: 'Node Backend', skills: ['Node.js', 'Express', 'MongoDB', 'JavaScript'] },
  { name: 'DevOps Cloud', skills: ['Docker', 'Kubernetes', 'AWS', 'Git'] },
  { name: 'Cloud Platform', skills: ['AWS', 'Azure', 'GCP', 'Docker'] },
  { name: 'AI Stack', skills: ['Python', 'Flask', 'PostgreSQL', 'AWS'] },
  { name: 'Mobile Kotlin', skills: ['Kotlin', 'Java', 'Git', 'MySQL'] },
  { name: 'Go Backend', skills: ['Go', 'PostgreSQL', 'Docker', 'Kubernetes'] },
  { name: 'Full Stack JS', skills: ['JavaScript', 'Node.js', 'React', 'MongoDB'] },
  { name: 'Enterprise Java', skills: ['Java', 'Spring Boot', 'Oracle', 'Angular'] },
  { name: 'Data Engineering', skills: ['Python', 'PostgreSQL', 'AWS', 'Docker'] },
];

function pick(arr, index) {
  return arr[index % arr.length];
}

function proficiencyFor(index, skillIndex) {
  return PROFICIENCY[(index + skillIndex) % PROFICIENCY.length];
}

function ratingFor(index, skillIndex) {
  const base = 6 + ((index * 3 + skillIndex * 2) % 5);
  return base;
}

function skillDateFor(index, skillIndex) {
  const year = 2018 + ((index + skillIndex) % 7);
  const month = String(((index + skillIndex * 2) % 12) + 1).padStart(2, '0');
  const day = String(((index + skillIndex) % 27) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function joiningDateFor(index) {
  const year = 2016 + (index % 8);
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function experienceFor(index) {
  return (1 + (index % 11) + (index % 3) * 0.5).toFixed(1);
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const headers = [
  'employeeCode', 'email', 'password', 'role', 'firstName', 'lastName',
  'department', 'designation', 'joiningDate', 'location', 'phoneNumber',
  'status', 'experienceYears', 'active',
];

for (let i = 1; i <= 5; i += 1) {
  headers.push(
    `skill${i}Name`, `skill${i}Proficiency`, `skill${i}SelfRating`, `skill${i}Date`,
  );
}

const rows = [headers.join(',')];

for (let i = 0; i < 50; i += 1) {
  const num = i + 1;
  const profile = SKILL_PROFILES[i % SKILL_PROFILES.length];
  const skills = profile.skills.slice(0, 5);

  const row = [
    `EMP-${1000 + num}`,
    `emp${1000 + num}@test.srh.com`,
    'employee123',
    'EMPLOYEE',
    FIRST_NAMES[i],
    LAST_NAMES[i],
    pick(DEPARTMENTS, i),
    pick(DESIGNATIONS, i + profile.skills.length),
    joiningDateFor(i),
    pick(LOCATIONS, i),
    `90000${String(10000 + num).slice(-5)}`,
    pick(STATUSES, i),
    experienceFor(i),
    'true',
  ];

  for (let s = 0; s < 5; s += 1) {
    if (s < skills.length) {
      row.push(
        skills[s],
        proficiencyFor(i, s),
        ratingFor(i, s),
        skillDateFor(i, s),
      );
    } else {
      row.push('', '', '', '');
    }
  }

  rows.push(row.map(csvEscape).join(','));
}

const outputPath = join(__dirname, 'employees-bulk-import-50.csv');
writeFileSync(outputPath, `${rows.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
