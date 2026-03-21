# Kali Linux Security Skills Reference

ArivuClaw includes 40 built-in security testing skills covering the full Kali Linux toolkit.

## Reconnaissance (10 skills)

| Skill | Tool | Description |
|-------|------|-------------|
| `nmap-scanner` | Nmap | Port scanning, service detection, OS fingerprinting, NSE scripts |
| `amass-recon` | OWASP Amass | DNS enumeration, subdomain discovery, attack surface mapping |
| `sublist3r-enum` | Sublist3r | Fast subdomain enumeration via search engines |
| `recon-ng` | Recon-ng | OSINT reconnaissance framework with modules |
| `maltego-osint` | Maltego | Link analysis, entity relationships, OSINT graphs |
| `nikto-scanner` | Nikto | Web server vulnerability scanner |
| `gobuster-enum` | Gobuster | Directory, DNS, and vhost brute-forcing |
| `ffuf-fuzzer` | ffuf | Fast web fuzzer for directories and parameters |
| `nuclei-scanner` | Nuclei | Template-based vulnerability scanner, CVE detection |
| `enum4linux` | Enum4linux | Windows/Samba enumeration (users, shares, groups) |

## Exploitation (10 skills)

| Skill | Tool | Description |
|-------|------|-------------|
| `metasploit-ops` | Metasploit | Exploit framework, payloads, post-exploitation |
| `burpsuite-proxy` | Burp Suite | Web app security proxy, scanner, intruder |
| `sqlmap-injection` | SQLMap | Automatic SQL injection detection and exploitation |
| `wpscan-wordpress` | WPScan | WordPress vulnerability scanner |
| `exploit-db` | SearchSploit | Search Exploit-DB for exploits |
| `vulnerability-scanner` | OpenVAS/Nessus | Comprehensive vulnerability assessment |
| `social-engineer` | SET | Phishing simulations, credential harvesting |
| `payload-gen` | msfvenom | Payload and shellcode generation |
| `reverse-shell` | Various | Reverse shell generators and listeners |
| `web-shells` | Various | Web shell generation, detection, analysis |

## Password & Wireless (10 skills)

| Skill | Tool | Description |
|-------|------|-------------|
| `john-cracker` | John the Ripper | Password hash cracking |
| `hashcat-gpu` | Hashcat | GPU-accelerated password cracking |
| `hydra-bruteforce` | Hydra | Network login brute-forcing (50+ protocols) |
| `aircrack-wifi` | Aircrack-ng | WiFi security testing, WPA/WPA2 cracking |
| `password-attacks` | Various | Wordlist gen, spraying, credential stuffing |
| `wireless-tools` | Reaver/Wifite | WPS attacks, automated wireless testing |
| `responder-mitm` | Responder | LLMNR/NBT-NS poisoning, NTLM relay |
| `wireshark-capture` | tshark | Packet capture and protocol analysis |
| `netcat-ops` | Netcat/Ncat | Network Swiss Army knife |
| `port-forwarding` | SSH/Chisel | Tunneling, port forwarding, pivoting |

## Post-Exploitation & Forensics (10 skills)

| Skill | Tool | Description |
|-------|------|-------------|
| `bloodhound-ad` | BloodHound | Active Directory attack path discovery |
| `impacket-tools` | Impacket | SMB, Kerberos, WMI network attacks |
| `crackmapexec` | CrackMapExec | Windows/AD network pentesting |
| `privilege-escalation` | LinPEAS/WinPEAS | Privesc enumeration and exploitation |
| `lateral-movement` | Various | Pass-the-Hash, Pass-the-Ticket, Evil-WinRM |
| `forensics-tools` | Various | Disk imaging, file recovery, timeline analysis |
| `volatility-mem` | Volatility | Memory forensics (processes, network, malware) |
| `autopsy-disk` | Autopsy/TSK | Disk forensics, file system analysis |
| `steganography` | Steghide/zsteg | Hide/extract data in images and files |
| `pivoting-tools` | Proxychains/Ligolo | Network pivoting and proxy chaining |

## Usage Examples

```
🦀 You: scan 192.168.1.0/24 with nmap for open ports
🦀 You: run nuclei against https://target.com
🦀 You: crack this hash with hashcat: 5f4dcc3b5aa765d61d8327deb882cf99
🦀 You: enumerate subdomains for example.com using amass
🦀 You: start a wireshark capture on eth0
🦀 You: check wordpress vulnerabilities on https://blog.example.com
🦀 You: analyze this memory dump with volatility
🦀 You: generate a reverse shell payload for linux x64
```

## Requirements

Most Kali skills require their respective tools installed. On Kali Linux or Parrot OS, these are pre-installed. On other systems:

```bash
# Debian/Ubuntu
sudo apt install nmap sqlmap nikto gobuster hydra aircrack-ng john hashcat wireshark tshark netcat-openbsd

# Or install Kali tools meta-package
sudo apt install kali-tools-top10
```

Skills with missing binaries are automatically filtered out at load time.
