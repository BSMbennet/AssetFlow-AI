// ============================================
// ASSETFLOW AI - Database Seed Script
// ============================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { registrationNumber: 'DEFAULT-ORG' },
    update: {},
    create: {
      name: 'AssetFlow AI',
      legalName: 'AssetFlow AI Inc.',
      type: 'OTHER',
      registrationNumber: 'DEFAULT-ORG',
      taxId: 'TAX-12345',
      country: 'US',
      city: 'New York',
      address: '123 Main St',
      postalCode: '10001',
      contactEmail: 'admin@assetflow.ai',
      contactPhone: '+1234567890',
      status: 'ACTIVE',
      settings: {
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#1e293b',
        },
        security: {
          requireMFA: true,
          sessionTimeout: 3600,
        },
      },
    },
  });

  console.log(`✅ Created organization: ${org.name}`);

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assetflow.ai' },
    update: {},
    create: {
      email: 'admin@assetflow.ai',
      firstName: 'Admin',
      lastName: 'User',
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      passwordHash: adminPassword,
      organizationId: org.id,
      emailVerified: true,
      mfaEnabled: false,
    },
  });

  console.log(`✅ Created admin user: ${admin.email}`);

  // Create sample assets
  const assets = [
    {
      name: 'Commercial Office Tower',
      description: 'Premium commercial office tower in downtown Manhattan',
      type: 'REAL_ESTATE',
      status: 'TOKENIZED',
      totalValue: 50000000,
      tokenPrice: 50,
      totalTokens: 1000000,
      availableTokens: 750000,
      jurisdiction: 'US-NY',
      metadata: {
        yearBuilt: 2018,
        size: 500000,
        sizeUnit: 'sqft',
        location: {
          address: '100 Park Avenue',
          city: 'New York',
          state: 'NY',
          country: 'US',
          postalCode: '10017',
        },
        occupancy: 0.92,
        leaseInfo: {
          annualRent: 15000000,
          occupancyRate: 0.92,
          leaseType: 'NET',
        },
        financials: {
          netOperatingIncome: 12000000,
          capRate: 0.07,
        },
      },
    },
    {
      name: 'Solar Energy Farm',
      description: 'Large-scale solar energy generation facility',
      type: 'RENEWABLE_ENERGY',
      status: 'TOKENIZED',
      totalValue: 25000000,
      tokenPrice: 25,
      totalTokens: 1000000,
      availableTokens: 600000,
      jurisdiction: 'US-TX',
      metadata: {
        size: 1000,
        sizeUnit: 'acres',
        location: {
          address: '123 Solar Road',
          city: 'Austin',
          state: 'TX',
          country: 'US',
          postalCode: '78701',
        },
        environmental: {
          energyEfficiency: 0.85,
          carbonFootprint: 0,
          sustainabilityScore: 0.92,
        },
        financials: {
          revenue: 5000000,
          expenses: 1000000,
          cashFlow: 4000000,
        },
      },
    },
  ];

  for (const assetData of assets) {
    const asset = await prisma.asset.create({
      data: {
        ...assetData,
        organizationId: org.id,
        createdById: admin.id,
      },
    });
    console.log(`✅ Created asset: ${asset.name}`);
  }

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });