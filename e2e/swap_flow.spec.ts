import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

test.beforeAll(async () => {
  // Clean up test data
  await prisma.swapRequest.deleteMany()
  await prisma.event.deleteMany()
  await prisma.user.deleteMany()
})

test.afterAll(async () => {
  await prisma.$disconnect()
})

test('full swap flow - happy path', async ({ page }) => {
  // Create test users
  const passwordHash = await bcrypt.hash('testpassword123', 10)
  
  const userA = await prisma.user.create({
    data: {
      email: 'usera@test.com',
      name: 'User A',
      password: passwordHash,
    },
  })

  const userB = await prisma.user.create({
    data: {
      email: 'userb@test.com',
      name: 'User B',
      password: passwordHash,
    },
  })

  // Create test events
  const eventA = await prisma.event.create({
    data: {
      title: 'Event A - Meeting',
      startTime: new Date('2024-12-25T10:00:00Z'),
      endTime: new Date('2024-12-25T11:00:00Z'),
      status: 'SWAPPABLE',
      ownerId: userA.id,
    },
  })

  const eventB = await prisma.event.create({
    data: {
      title: 'Event B - Workshop',
      startTime: new Date('2024-12-25T14:00:00Z'),
      endTime: new Date('2024-12-25T15:00:00Z'),
      status: 'SWAPPABLE',
      ownerId: userB.id,
    },
  })

  try {
    // Step 1: Log in as User A
    await page.goto('/login')
    await page.fill('input[type="email"]', 'usera@test.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Step 2: Navigate to marketplace
    await page.goto('/marketplace')
    await page.waitForLoadState('networkidle')

    // Step 3: Find Event B and click "Request Swap"
    await page.click(`text=Event B - Workshop`)
    await page.click('button:has-text("Request Swap")')

    // Step 4: Select Event A from dropdown and confirm
    await page.waitForSelector('[role="combobox"]')
    await page.click('[role="combobox"]')
    await page.click(`text=Event A - Meeting`)
    await page.click('button:has-text("Confirm Request")')
    await page.waitForSelector('text=Swap request sent successfully', { timeout: 5000 })

    // Step 5: Log out
    await page.click('button:has-text("Logout")')
    await page.waitForURL('/login')

    // Step 6: Log in as User B
    await page.fill('input[type="email"]', 'userb@test.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Step 7: Navigate to requests page
    await page.goto('/requests')
    await page.waitForLoadState('networkidle')

    // Step 8: Accept the swap request
    await page.click('button:has-text("Accept")')
    await page.waitForSelector('text=Swap request accepted', { timeout: 5000 })

    // Step 9: Verify database state
    const updatedEventA = await prisma.event.findUnique({
      where: { id: eventA.id },
    })

    const updatedEventB = await prisma.event.findUnique({
      where: { id: eventB.id },
    })

    const swapRequest = await prisma.swapRequest.findFirst({
      where: {
        mySlotId: eventA.id,
        theirSlotId: eventB.id,
      },
    })

    // Assertions
    expect(updatedEventA?.ownerId).toBe(userB.id)
    expect(updatedEventB?.ownerId).toBe(userA.id)
    expect(swapRequest?.status).toBe('ACCEPTED')
    expect(updatedEventA?.status).toBe('BUSY')
    expect(updatedEventB?.status).toBe('BUSY')
  } finally {
    // Cleanup
    await prisma.swapRequest.deleteMany()
    await prisma.event.deleteMany()
    await prisma.user.deleteMany()
  }
})

