// Interest mapping for each profession
const INTERESTS_BY_PROFESSION = {
  'Security Engineer': [
    { id: 1, name: 'Vulnerability Research & Exploit Development' },
    { id: 2, name: 'Application Security & Secure Coding' },
    { id: 3, name: 'Network Security & Firewalls' },
    { id: 4, name: 'Cloud Security (AWS, Azure, GCP)' },
    { id: 5, name: 'Identity & Access Management' },
    { id: 6, name: 'Mobile Security & IoT' }
  ],
  'Software Developer': [
    { id: 7, name: 'Frontend Frameworks (React, Vue, Angular)' },
    { id: 8, name: 'Backend & APIs (Node, Python, Go)' },
    { id: 9, name: 'Databases & Data Engineering' },
    { id: 10, name: 'AI/ML & Machine Learning Tools' },
    { id: 11, name: 'Mobile Development (iOS, Android, Flutter)' },
    { id: 12, name: 'Game Development & Graphics' }
  ],
  'DevOps/SRE': [
    { id: 13, name: 'Containers & Orchestration (Docker, K8s)' },
    { id: 14, name: 'CI/CD & Automation Pipelines' },
    { id: 15, name: 'Cloud Infrastructure (AWS, Azure, GCP)' },
    { id: 16, name: 'Monitoring & Observability' },
    { id: 17, name: 'Infrastructure as Code (Terraform, Ansible)' },
    { id: 18, name: 'Performance & Site Reliability' }
  ],
  'System Administrator': [
    { id: 19, name: 'Linux Administration & Shell Scripting' },
    { id: 20, name: 'Windows Server & Active Directory' },
    { id: 21, name: 'Networking & DNS Management' },
    { id: 22, name: 'Storage & Backup Solutions' },
    { id: 23, name: 'Virtualization (VMware, Hyper-V)' },
    { id: 24, name: 'Automation & Configuration Management' }
  ],
  'Security Analyst': [
    { id: 25, name: 'Threat Intelligence & Threat Hunting' },
    { id: 26, name: 'Incident Response & Forensics' },
    { id: 27, name: 'Security Operations & SIEM' },
    { id: 28, name: 'Malware Analysis & Reverse Engineering' },
    { id: 29, name: 'Penetration Testing & Red Teaming' },
    { id: 30, name: 'Compliance & Risk Management' }
  ],
  'Other': [
    { id: 31, name: 'Cybersecurity & Privacy' },
    { id: 32, name: 'Software Development & Programming' },
    { id: 33, name: 'Cloud & Infrastructure' },
    { id: 34, name: 'AI & Machine Learning' },
    { id: 35, name: 'Data Science & Analytics' },
    { id: 36, name: 'Web Technologies & Frameworks' }
  ]
};

// Get all interests except for the specified profession
function getAdditionalInterests(currentProfession) {
  const additional = {};
  
  Object.keys(INTERESTS_BY_PROFESSION).forEach(profession => {
    if (profession !== currentProfession) {
      additional[profession] = INTERESTS_BY_PROFESSION[profession];
    }
  });
  
  return additional;
}

// Get interests for a specific profession
function getInterestsForProfession(profession) {
  return INTERESTS_BY_PROFESSION[profession] || [];
}