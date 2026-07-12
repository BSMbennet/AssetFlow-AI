// ============================================
// ASSETFLOW AI - South African Database Seed Script
// ============================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding South African database context...');

  // Create default South African organization
  const org = await prisma.organization.upsert({
    where: { registrationNumber: '2023/123456/07' },
    update: {},
    create: {
      name: 'AssetFlow AI South Africa',
      legalName: 'AssetFlow AI (Pty) Ltd',
      type: 'INVESTMENT_FIRM',
      registrationNumber: '2023/123456/07', // CIPC format
      taxId: '9123456789', // SARS tax reference number format
      country: 'ZA',
      city: 'Sandton',
      address: '129 Rivonia Road, Sandton CBD',
      postalCode: '2196',
      contactEmail: 'admin@assetflow.co.za',
      contactPhone: '+27112345678',
      status: 'ACTIVE',
      settings: {
        branding: {
          primaryColor: '#007A4D', // South African Green
          secondaryColor: '#FFB612', // South African Gold
        },
        security: {
          requireMFA: true,
          sessionTimeout: 3600,
        },
        localization: {
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg',
        }
      },
    },
  });

  console.log(`✅ Created organization: ${org.legalName}`);

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assetflow.co.za' },
    update: {},
    create: {
      email: 'admin@assetflow.co.za',
      firstName: 'Thabo',
      lastName: 'Mokoena',
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      passwordHash: adminPassword,
      organizationId: org.id,
      emailVerified: true,
      mfaEnabled: true,
      timezone: 'Africa/Johannesburg',
      language: 'en-ZA',
    },
  });

  console.log(`✅ Created admin user: ${admin.email}`);

  // Establish standard FICA Compliance Case for the Admin
  const kycCheck = await prisma.kycCheck.create({
    data: {
      userId: admin.id,
      status: 'VERIFIED',
      provider: 'FICA_DIRECT_API',
      providerReference: 'FICA-REQ-99812',
      notes: 'Smart ID and Proof of Residence verified against Dept of Home Affairs database.',
      result: { ficaCompliant: true, riskRating: 'LOW' }
    }
  });

  await prisma.complianceCase.create({
    data: {
      type: 'KYC',
      status: 'CLOSED',
      priority: 'HIGH',
      userId: admin.id,
      organizationId: org.id,
      kycCheckId: kycCheck.id,
      description: 'Initial FICA onboarding and SARS tax clearance verification for institutional admin.',
      findings: 'All CIPC and SARS documentation validated. PEP screening clear.',
      resolution: 'Approved for platform operations.',
    }
  });

  console.log(`✅ Initialized FICA compliance records`);

  // Create sample South African assets
  const assets = [
    {
      name: 'Sandton Corporate Campus',
      description: 'Premium Grade-A commercial office campus located in the heart of the Sandton financial district.',
      type: 'REAL_ESTATE' as const,
      status: 'TOKENIZED' as const,
      totalValue: 850000000, // ZAR
      tokenPrice: 850,
      totalTokens: BigInt(1000000),
      availableTokens: BigInt(750000),
      jurisdiction: 'ZA-GT',
      metadata: {
        yearBuilt: 2021,
        size: 45000,
        sizeUnit: 'sqm',
        location: {
          address: 'Alice Lane, Sandton',
          city: 'Johannesburg',
          province: 'Gauteng',
          country: 'ZA',
          postalCode: '2196',
        },
        occupancy: 0.94,
        leaseInfo: {
          annualRent: 85000000, // ZAR
          occupancyRate: 0.94,
          leaseType: 'TRIPLE_NET',
        },
        financials: {
          netOperatingIncome: 75000000, // ZAR
          capRate: 0.088,
        },
      },
    },
    {
      name: 'Kalahari Solar Photovoltaic Facility',
      description: '100MW Utility-scale solar energy generation facility supplying the national grid.',
      type: 'RENEWABLE_ENERGY' as const,
      status: 'TOKENIZED' as const,
      totalValue: 1200000000, // ZAR
      tokenPrice: 1200,
      totalTokens: BigInt(1000000),
      availableTokens: BigInt(450000),
      jurisdiction: 'ZA-NC',
      metadata: {
        size: 850,
        sizeUnit: 'hectares',
        location: {
          address: 'Farm 45, N14 Highway',
          city: 'Upington',
          province: 'Northern Cape',
          country: 'ZA',
          postalCode: '8800',
        },
        environmental: {
          capacityMW: 100,
          energyEfficiency: 0.88,
          carbonFootprint: 0,
          sustainabilityScore: 0.98,
        },
        financials: {
          revenue: 180000000, // ZAR (Eskom PPA)
          expenses: 35000000, // ZAR
          cashFlow: 145000000, // ZAR
        },
      },
    },
  ];

  for (const assetData of assets) {
    const { metadata, ...coreData } = assetData;
    const asset = await prisma.asset.create({
      data: {
        ...coreData,
        metadata: metadata as any,
        organizationId: org.id,
        createdById: admin.id,
      },
    });
    console.log(`✅ Created asset: ${asset.name}`);
  }

  console.log('✅ South African database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });