const professionQuestions = {
  "Security Engineer": {
    title: "What security topics interest you most?",
    options: [
      { icon: "🔐", text: "Vulnerability Research & Exploit Development", tags: ["vulnerability", "exploit", "CVE", "zero-day"] },
      { icon: "🛡️", text: "Application Security & Secure Coding", tags: ["appsec", "secure coding", "OWASP", "code review"] },
      { icon: "🌐", text: "Network Security & Firewalls", tags: ["network security", "firewall", "IDS", "IPS"] },
      { icon: "☁️", text: "Cloud Security (AWS, Azure, GCP)", tags: ["cloud security", "AWS", "Azure", "GCP", "kubernetes security"] },
      { icon: "🔑", text: "Identity & Access Management", tags: ["IAM", "authentication", "SSO", "OAuth", "zero trust"] },
      { icon: "📱", text: "Mobile Security & IoT", tags: ["mobile security", "IoT", "Android", "iOS security"] }
    ]
  },
  
  "Software Developer": {
    title: "What development areas interest you?",
    options: [
      { icon: "⚛️", text: "Frontend Frameworks (React, Vue, Angular)", tags: ["React", "Vue", "Angular", "frontend", "JavaScript"] },
      { icon: "🖥️", text: "Backend & APIs (Node, Python, Go)", tags: ["backend", "API", "Node.js", "Python", "Go", "REST"] },
      { icon: "📦", text: "Databases & Data Engineering", tags: ["database", "SQL", "PostgreSQL", "MongoDB", "data engineering"] },
      { icon: "🤖", text: "AI/ML & Machine Learning Tools", tags: ["AI", "machine learning", "ML", "TensorFlow", "PyTorch"] },
      { icon: "📱", text: "Mobile Development (iOS, Android, Flutter)", tags: ["mobile", "iOS", "Android", "Flutter", "React Native"] },
      { icon: "🎮", text: "Game Development & Graphics", tags: ["game dev", "Unity", "Unreal", "graphics", "WebGL"] }
    ]
  },
  
  "DevOps/SRE": {
    title: "What DevOps topics interest you?",
    options: [
      { icon: "🐳", text: "Containers & Orchestration (Docker, K8s)", tags: ["Docker", "Kubernetes", "container", "orchestration"] },
      { icon: "🔄", text: "CI/CD & Automation Pipelines", tags: ["CI/CD", "Jenkins", "GitLab", "GitHub Actions", "automation"] },
      { icon: "☁️", text: "Cloud Infrastructure (AWS, Azure, GCP)", tags: ["AWS", "Azure", "GCP", "cloud", "infrastructure"] },
      { icon: "📊", text: "Monitoring & Observability", tags: ["monitoring", "observability", "Prometheus", "Grafana", "logging"] },
      { icon: "🏗️", text: "Infrastructure as Code (Terraform, Ansible)", tags: ["IaC", "Terraform", "Ansible", "CloudFormation"] },
      { icon: "⚡", text: "Performance & Site Reliability", tags: ["performance", "SRE", "reliability", "scaling", "latency"] }
    ]
  },
  
  "System Administrator": {
    title: "What system topics interest you?",
    options: [
      { icon: "🐧", text: "Linux Administration & Shell Scripting", tags: ["Linux", "bash", "shell", "Ubuntu", "RedHat"] },
      { icon: "🪟", text: "Windows Server & Active Directory", tags: ["Windows Server", "Active Directory", "PowerShell", "AD"] },
      { icon: "🌐", text: "Networking & DNS Management", tags: ["networking", "DNS", "TCP/IP", "routing", "VPN"] },
      { icon: "💾", text: "Storage & Backup Solutions", tags: ["storage", "backup", "NAS", "SAN", "disaster recovery"] },
      { icon: "🖥️", text: "Virtualization (VMware, Hyper-V)", tags: ["virtualization", "VMware", "Hyper-V", "virtual machine"] },
      { icon: "🔧", text: "Automation & Configuration Management", tags: ["automation", "Puppet", "Chef", "scripting"] }
    ]
  },
  
  "Security Analyst": {
    title: "What security analysis areas interest you?",
    options: [
      { icon: "🔍", text: "Threat Intelligence & Threat Hunting", tags: ["threat intelligence", "threat hunting", "IOC", "TTPs"] },
      { icon: "🚨", text: "Incident Response & Forensics", tags: ["incident response", "forensics", "DFIR", "malware analysis"] },
      { icon: "🛡️", text: "Security Operations & SIEM", tags: ["SOC", "SIEM", "security operations", "Splunk", "ELK"] },
      { icon: "🦠", text: "Malware Analysis & Reverse Engineering", tags: ["malware", "reverse engineering", "analysis", "ransomware"] },
      { icon: "🎯", text: "Penetration Testing & Red Teaming", tags: ["pentesting", "red team", "ethical hacking", "Metasploit"] },
      { icon: "📋", text: "Compliance & Risk Management", tags: ["compliance", "risk", "audit", "GDPR", "ISO 27001"] }
    ]
  },
  
  "Other": {
    title: "What tech topics interest you?",
    options: [
      { icon: "🔒", text: "Cybersecurity & Privacy", tags: ["cybersecurity", "security", "privacy", "encryption"] },
      { icon: "💻", text: "Software Development & Programming", tags: ["programming", "software", "coding", "development"] },
      { icon: "☁️", text: "Cloud & Infrastructure", tags: ["cloud", "infrastructure", "DevOps", "AWS"] },
      { icon: "🤖", text: "AI & Machine Learning", tags: ["AI", "machine learning", "artificial intelligence", "ML"] },
      { icon: "📊", text: "Data Science & Analytics", tags: ["data science", "analytics", "big data", "data"] },
      { icon: "🌐", text: "Web Technologies & Frameworks", tags: ["web", "frontend", "backend", "JavaScript"] }
    ]
  }
};