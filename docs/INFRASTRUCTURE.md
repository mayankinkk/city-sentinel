# 🏗️ City Sentinel - Infrastructure Requirements

Detailed infrastructure specifications for government/enterprise deployment.

---

## 📊 Sizing Guide

### Small City (< 500,000 population)

| Component | Specification | Estimated Cost/Month |
|-----------|--------------|---------------------|
| **Web Server** | 2 vCPU, 4GB RAM, 50GB SSD | ₹2,000 - ₹4,000 |
| **Database** | 2 vCPU, 4GB RAM, 100GB SSD | ₹3,000 - ₹5,000 |
| **Storage** | 100GB Object Storage | ₹500 - ₹1,000 |
| **Bandwidth** | 500GB/month | ₹1,000 - ₹2,000 |
| **Total** | | **₹6,500 - ₹12,000** |

**Expected Load:**
- 1,000-5,000 daily active users
- 50-200 issues reported/day
- 10-50GB image uploads/month

### Medium City (500,000 - 2,000,000 population)

| Component | Specification | Estimated Cost/Month |
|-----------|--------------|---------------------|
| **Load Balancer** | Application LB | ₹2,000 - ₹3,000 |
| **Web Servers (2x)** | 4 vCPU, 8GB RAM each | ₹8,000 - ₹12,000 |
| **Database (Primary)** | 4 vCPU, 16GB RAM, 500GB SSD | ₹10,000 - ₹15,000 |
| **Database (Replica)** | 4 vCPU, 16GB RAM, 500GB SSD | ₹10,000 - ₹15,000 |
| **Storage** | 500GB Object Storage | ₹2,000 - ₹4,000 |
| **CDN** | Edge caching | ₹3,000 - ₹5,000 |
| **Bandwidth** | 2TB/month | ₹4,000 - ₹6,000 |
| **Total** | | **₹39,000 - ₹60,000** |

**Expected Load:**
- 5,000-25,000 daily active users
- 200-1,000 issues reported/day
- 50-200GB image uploads/month

### Large City / State Level (> 2,000,000 population)

| Component | Specification | Estimated Cost/Month |
|-----------|--------------|---------------------|
| **Load Balancer** | Multi-region LB | ₹5,000 - ₹8,000 |
| **Web Servers (4x)** | 8 vCPU, 16GB RAM each | ₹32,000 - ₹48,000 |
| **Database Cluster** | 3-node HA cluster, 32GB RAM each | ₹50,000 - ₹75,000 |
| **Redis Cache** | 2 vCPU, 8GB RAM | ₹5,000 - ₹8,000 |
| **Storage** | 2TB Object Storage | ₹6,000 - ₹10,000 |
| **CDN** | Global edge network | ₹10,000 - ₹15,000 |
| **Monitoring** | APM + Log aggregation | ₹5,000 - ₹8,000 |
| **Bandwidth** | 10TB/month | ₹15,000 - ₹25,000 |
| **Total** | | **₹1,28,000 - ₹1,97,000** |

**Expected Load:**
- 25,000-100,000+ daily active users
- 1,000-5,000 issues reported/day
- 200-1000GB image uploads/month

---

## 🖥️ Recommended Cloud Providers

### For Indian Government Projects

| Provider | Data Center Location | Compliance | Best For |
|----------|---------------------|------------|----------|
| **AWS India** | Mumbai, Hyderabad | MeitY empaneled | Large scale |
| **Azure India** | Pune, Chennai, Mumbai | MeitY empaneled | Enterprise |
| **Google Cloud India** | Mumbai, Delhi | MeitY empaneled | ML features |
| **Yotta/CtrlS** | Mumbai, Noida | India-only data | Govt preference |
| **NIC Cloud** | Multiple India DCs | Govt owned | Central govt |
| **ESDS** | Nashik, Mumbai | MeitY empaneled | State govt |

### For Self-Hosted On-Premise

| Component | Recommended Hardware |
|-----------|---------------------|
| **Server** | Dell PowerEdge R650 / HPE ProLiant DL380 |
| **CPU** | Intel Xeon Gold 6330 (2x for HA) |
| **RAM** | 128GB DDR4 ECC |
| **Storage** | 4x 1TB NVMe SSD (RAID 10) |
| **Network** | 10GbE dual-port NIC |
| **UPS** | 3kVA online UPS with 30min backup |

---

## 🔒 Security Requirements

### Network Security

```
┌──────────────────────────────────────────────────────────────┐
│                         DMZ Zone                              │
│  ┌────────────────┐                                          │
│  │  Load Balancer │ ← Only port 443 from internet            │
│  └───────┬────────┘                                          │
└──────────┼───────────────────────────────────────────────────┘
           │
┌──────────┼───────────────────────────────────────────────────┐
│          ▼           Application Zone                         │
│  ┌────────────────┐  ┌────────────────┐                      │
│  │  Web Server 1  │  │  Web Server 2  │                      │
│  └───────┬────────┘  └───────┬────────┘                      │
└──────────┼───────────────────┼───────────────────────────────┘
           │                   │
┌──────────┼───────────────────┼───────────────────────────────┐
│          ▼                   ▼         Data Zone              │
│  ┌─────────────────────────────────────┐                     │
│  │           Database Cluster           │ ← No internet       │
│  │      (Primary + Read Replicas)       │   access            │
│  └─────────────────────────────────────┘                     │
│  ┌─────────────────────────────────────┐                     │
│  │          Object Storage              │                     │
│  └─────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────┘
```

### Compliance Requirements

| Standard | Requirement | Implementation |
|----------|-------------|----------------|
| **IT Act 2000** | Data localization | India-based servers only |
| **DPDP Act 2023** | Consent management | Built-in consent forms |
| **ISO 27001** | Information security | Encryption at rest/transit |
| **GIGW Guidelines** | Govt website standards | Accessibility compliance |
| **MeitY Cloud Guidelines** | Empaneled providers | Certified cloud usage |

### Encryption Standards

| Layer | Algorithm | Key Size |
|-------|-----------|----------|
| **TLS** | TLS 1.3 | 256-bit |
| **Database** | AES-256-GCM | 256-bit |
| **File Storage** | AES-256-CBC | 256-bit |
| **Password Hashing** | Argon2id | - |
| **JWT Signing** | RS256 | 2048-bit |

---

## 📈 Scaling Strategy

### Horizontal Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU utilization | > 70% for 5 min | Add web server |
| Memory usage | > 80% for 5 min | Add web server |
| Request latency | > 500ms P95 | Add web server |
| DB connections | > 80% pool | Add read replica |
| Storage usage | > 80% capacity | Expand storage |

### Auto-Scaling Configuration (AWS)

```yaml
# cloudformation-autoscaling.yaml
AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    MinSize: 2
    MaxSize: 10
    DesiredCapacity: 2
    HealthCheckType: ELB
    HealthCheckGracePeriod: 300
    
ScalingPolicy:
  Type: AWS::AutoScaling::ScalingPolicy
  Properties:
    PolicyType: TargetTrackingScaling
    TargetTrackingConfiguration:
      PredefinedMetricSpecification:
        PredefinedMetricType: ASGAverageCPUUtilization
      TargetValue: 70
```

---

## 🔄 High Availability Architecture

### Multi-AZ Deployment

```
                    ┌─────────────────┐
                    │   Route 53 /    │
                    │   CloudFlare    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────────────────────────────────────────┐
    │              Application Load Balancer           │
    │                  (Multi-AZ)                      │
    └──────────────────────┬──────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐
    │   AZ-A  │       │   AZ-B  │       │   AZ-C  │
    │ Web x2  │       │ Web x2  │       │ Web x2  │
    └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
    ┌──────────────────────┴──────────────────────────┐
    │                                                  │
    │     ┌──────────┐  Sync  ┌──────────┐            │
    │     │ Primary  │◄──────►│ Standby  │            │
    │     │    DB    │        │    DB    │            │
    │     │  (AZ-A)  │        │  (AZ-B)  │            │
    │     └──────────┘        └──────────┘            │
    │                                                  │
    │     ┌──────────────────────────────┐            │
    │     │      S3 / Object Storage     │            │
    │     │     (Cross-Region Replicated) │            │
    │     └──────────────────────────────┘            │
    └──────────────────────────────────────────────────┘
```

### Recovery Objectives

| Metric | Target | Implementation |
|--------|--------|----------------|
| **RTO** (Recovery Time) | < 15 minutes | Auto-failover, health checks |
| **RPO** (Recovery Point) | < 5 minutes | Synchronous replication |
| **Uptime SLA** | 99.9% | Multi-AZ, load balancing |
| **Backup Frequency** | Every 6 hours | Automated snapshots |
| **Backup Retention** | 30 days | Lifecycle policies |

---

## 📱 Network Requirements

### Bandwidth Calculation

```
Daily Active Users: 10,000
Average Session Duration: 10 minutes
Average Page Size: 2 MB
Pages per Session: 5

Daily Bandwidth = 10,000 × 5 × 2 MB = 100 GB/day
Monthly Bandwidth = 100 GB × 30 = 3 TB/month

Peak Hour Traffic (10% of daily in 1 hour):
= 100 GB × 0.1 / 3600 seconds
= 27.7 MB/s ≈ 222 Mbps

Recommended: 500 Mbps with burstable to 1 Gbps
```

### CDN Configuration

| Asset Type | Cache TTL | Edge Locations |
|------------|-----------|----------------|
| Static JS/CSS | 1 year | All India |
| Images | 1 week | All India |
| API responses | No cache | - |
| Map tiles | 1 day | All India |

---

## 💰 Cost Optimization Tips

1. **Reserved Instances**: 30-40% savings for 1-year commitment
2. **Spot Instances**: Use for non-critical batch processing
3. **Right-sizing**: Start small, scale based on actual usage
4. **Storage Tiering**: Move old images to cold storage after 90 days
5. **CDN Caching**: Reduce origin load by 70%+
6. **Database Read Replicas**: Offload read traffic from primary

---

## 📞 Support & SLA

### Recommended SLA Terms for Government Contracts

| Priority | Response Time | Resolution Time | Example |
|----------|---------------|-----------------|---------|
| **P1 - Critical** | 15 minutes | 4 hours | System down |
| **P2 - High** | 1 hour | 8 hours | Major feature broken |
| **P3 - Medium** | 4 hours | 24 hours | Minor bug |
| **P4 - Low** | 24 hours | 72 hours | Enhancement request |

### Annual Maintenance Contract (AMC) Scope

- 24/7 monitoring and alerting
- Security patch management
- Database backup verification
- Performance optimization
- Quarterly security audits
- Disaster recovery testing

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Author:** City Sentinel Team
