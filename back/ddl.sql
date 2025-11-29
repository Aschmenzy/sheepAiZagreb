CREATE TABLE IF NOT EXISTS articles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    link        TEXT NOT NULL UNIQUE,
    title       TEXT,
    full_text   TEXT,
    summary     TEXT,
    category    TEXT,
    subcategory TEXT,
    article     INTEGER NOT NULL DEFAULT 0,
    date        TEXT,
    imageUrl    TEXT
);

CREATE TABLE IF NOT EXISTS interests (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN (
    -- Security Engineer
    'Vulnerability Research & Exploit Development',
    'Application Security & Secure Coding',
    'Network Security & Firewalls',
    'Cloud Security (AWS, Azure, GCP)',
    'Identity & Access Management',
    'Mobile Security & IoT',

    -- Software Developer
    'Frontend Frameworks (React, Vue, Angular)',
    'Backend & APIs (Node, Python, Go)',
    'Databases & Data Engineering',
    'AI/ML & Machine Learning Tools',
    'Mobile Development (iOS, Android, Flutter)',
    'Game Development & Graphics',

    -- DevOps/SRE
    'Containers & Orchestration (Docker, K8s)',
    'CI/CD & Automation Pipelines',
    'Cloud Infrastructure (AWS, Azure, GCP)',
    'Monitoring & Observability',
    'Infrastructure as Code (Terraform, Ansible)',
    'Performance & Site Reliability',

    -- System Administrator
    'Linux Administration & Shell Scripting',
    'Windows Server & Active Directory',
    'Networking & DNS Management',
    'Storage & Backup Solutions',
    'Virtualization (VMware, Hyper-V)',
    'Automation & Configuration Management',

    -- Security Analyst
    'Threat Intelligence & Threat Hunting',
    'Incident Response & Forensics',
    'Security Operations & SIEM',
    'Malware Analysis & Reverse Engineering',
    'Penetration Testing & Red Teaming',
    'Compliance & Risk Management',

    -- Other
    'Cybersecurity & Privacy',
    'Software Development & Programming',
    'Cloud & Infrastructure',
    'AI & Machine Learning',
    'Data Science & Analytics',
    'Web Technologies & Frameworks'
  ))
);
INSERT OR IGNORE INTO interests (id, name) VALUES
  -- Security Engineer
  (1, 'Vulnerability Research & Exploit Development'),
  (2, 'Application Security & Secure Coding'),
  (3, 'Network Security & Firewalls'),
  (4, 'Cloud Security (AWS, Azure, GCP)'),
  (5, 'Identity & Access Management'),
  (6, 'Mobile Security & IoT'),
  
  -- Software Developer
  (7, 'Frontend Frameworks (React, Vue, Angular)'),
  (8, 'Backend & APIs (Node, Python, Go)'),
  (9, 'Databases & Data Engineering'),
  (10, 'AI/ML & Machine Learning Tools'),
  (11, 'Mobile Development (iOS, Android, Flutter)'),
  (12, 'Game Development & Graphics'),
  
  -- DevOps/SRE
  (13, 'Containers & Orchestration (Docker, K8s)'),
  (14, 'CI/CD & Automation Pipelines'),
  (15, 'Cloud Infrastructure (AWS, Azure, GCP)'),
  (16, 'Monitoring & Observability'),
  (17, 'Infrastructure as Code (Terraform, Ansible)'),
  (18, 'Performance & Site Reliability'),
  
  -- System Administrator
  (19, 'Linux Administration & Shell Scripting'),
  (20, 'Windows Server & Active Directory'),
  (21, 'Networking & DNS Management'),
  (22, 'Storage & Backup Solutions'),
  (23, 'Virtualization (VMware, Hyper-V)'),
  (24, 'Automation & Configuration Management'),
  
  -- Security Analyst
  (25, 'Threat Intelligence & Threat Hunting'),
  (26, 'Incident Response & Forensics'),
  (27, 'Security Operations & SIEM'),
  (28, 'Malware Analysis & Reverse Engineering'),
  (29, 'Penetration Testing & Red Teaming'),
  (30, 'Compliance & Risk Management'),
  
  -- Other
  (31, 'Cybersecurity & Privacy'),
  (32, 'Software Development & Programming'),
  (33, 'Cloud & Infrastructure'),
  (34, 'AI & Machine Learning'),
  (35, 'Data Science & Analytics'),
  (36, 'Web Technologies & Frameworks');

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  job TEXT NOT NULL CHECK (job IN (
    'Security Engineer',
    'Software Developer',
    'DevOps/SRE',
    'System Administrator',
    'Security Analyst',
    'Other'
  )),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_interests (
  user_id INTEGER NOT NULL,
  interest_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, interest_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (interest_id) REFERENCES interests(id)
);

CREATE TABLE IF NOT EXISTS article_job_scores (
  article_id INTEGER NOT NULL,
  job       TEXT NOT NULL CHECK (job IN (
               'Security Engineer',
               'Software Developer',
               'DevOps/SRE',
               'System Administrator',
               'Security Analyst',
               'Other'
             )),
  score     REAL NOT NULL,              -- e.g. 0.0–1.0 or 0–100
  PRIMARY KEY (article_id, job),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS article_interest_scores (
  article_id  INTEGER NOT NULL,
  interest_id INTEGER NOT NULL,
  score       REAL NOT NULL,           -- e.g. 0.0–1.0 or 0–100
  PRIMARY KEY (article_id, interest_id),
  FOREIGN KEY (article_id)  REFERENCES articles(id)  ON DELETE CASCADE,
  FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE
);

